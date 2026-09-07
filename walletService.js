import { getDb } from "./db.js";

export async function getWallet(userId) {
  const db = getDb();

  const result = await db.query(
    `
    SELECT
      u.id,
      u.balance,
      COALESCE(
        SUM(
          CASE
            WHEN wl.amount > 0 THEN wl.amount
            ELSE 0
          END
        ),
        0
      ) AS total_earned
    FROM users u
    LEFT JOIN wallet_ledger wl
      ON wl.user_id = u.id
    WHERE u.id = $1
    GROUP BY u.id, u.balance
    `,
    [userId]
  );

  if (!result.rows[0]) {
    throw new Error("User not found.");
  }

  return {
    userId: result.rows[0].id,
    balance: Number(result.rows[0].balance),
    totalEarned: Number(result.rows[0].total_earned)
  };
}

export async function addBalance(
  userId,
  amount,
  type,
  referenceId = null
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid balance amount.");
  }

  if (!type || typeof type !== "string") {
    throw new Error("Transaction type is required.");
  }

  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (!userResult.rows[0]) {
      throw new Error("User not found.");
    }

    await client.query(
      `
      UPDATE users
      SET
        balance = balance + $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [amount, userId]
    );

    const ledgerResult = await client.query(
      `
      INSERT INTO wallet_ledger (
        user_id,
        amount,
        type,
        reference_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        amount,
        type,
        reference_id,
        created_at
      `,
      [userId, amount, type, referenceId]
    );

    await client.query("COMMIT");

    return ledgerResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
