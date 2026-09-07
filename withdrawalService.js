import { getDb } from "./db.js";
import { CONFIG } from "./config.js";

function isWithdrawalLocked() {
  return Date.now() < new Date(CONFIG.campaign.endAt).getTime();
}

export async function createWithdrawal(
  userId,
  amount,
  destination
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid withdrawal amount.");
  }

  if (!destination || typeof destination !== "string") {
    throw new Error("Withdrawal destination is required.");
  }

  if (isWithdrawalLocked()) {
    throw new Error(
      "Withdrawals are locked until 5 January 2027."
    );
  }

  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
      SELECT id, balance
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId]
    );

    const user = userResult.rows[0];

    if (!user) {
      throw new Error("User not found.");
    }

    const balance = Number(user.balance);

    if (amount > balance) {
      throw new Error("Insufficient ZKO balance.");
    }

    await client.query(
      `
      UPDATE users
      SET
        balance = balance - $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [amount, userId]
    );

    const withdrawalResult = await client.query(
      `
      INSERT INTO withdrawals (
        user_id,
        amount,
        destination,
        status
      )
      VALUES ($1, $2, $3, 'pending')
      RETURNING
        id,
        amount,
        destination,
        status,
        created_at
      `,
      [userId, amount, destination]
    );

    await client.query(
      `
      INSERT INTO wallet_ledger (
        user_id,
        amount,
        type,
        reference_id
      )
      VALUES ($1, $2, 'withdrawal_hold', $3)
      `,
      [
        userId,
        -amount,
        String(withdrawalResult.rows[0].id)
      ]
    );

    await client.query("COMMIT");

    return withdrawalResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
      }
