import { getDb } from "./db.js";

export async function findUserByTelegramId(telegramId) {
  const db = getDb();

  const result = await db.query(
    `
    SELECT
      id,
      telegram_id,
      username,
      first_name,
      last_name,
      role,
      balance,
      created_at,
      updated_at
    FROM users
    WHERE telegram_id = $1
    LIMIT 1
    `,
    [String(telegramId)]
  );

  return result.rows[0] ?? null;
}

export async function createOrUpdateUser(userData) {
  const db = getDb();

  const telegramId = String(userData.telegramId);

  const result = await db.query(
    `
    INSERT INTO users (
      telegram_id,
      username,
      first_name,
      last_name
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (telegram_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = NOW()
    RETURNING
      id,
      telegram_id,
      username,
      first_name,
      last_name,
      role,
      balance,
      created_at,
      updated_at
    `,
    [
      telegramId,
      userData.username ?? null,
      userData.firstName ?? null,
      userData.lastName ?? null
    ]
  );

  return result.rows[0];
}

export async function getUserBalance(userId) {
  const db = getDb();

  const result = await db.query(
    `
    SELECT balance
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (!result.rows[0]) {
    throw new Error("User not found.");
  }

  return Number(result.rows[0].balance);
}
