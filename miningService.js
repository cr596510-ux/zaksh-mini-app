import crypto from "node:crypto";
import { getDb } from "./db.js";
import { CONFIG } from "./config.js";

const MINING_DURATION_MS =
  CONFIG.mining.durationSeconds * 1000;

const COOLDOWN_MS =
  CONFIG.mining.cooldownHours * 60 * 60 * 1000;

function randomReward() {
  const min = CONFIG.economy.miningRewardMin;
  const max = CONFIG.economy.miningRewardMax;

  return min + crypto.randomInt(
    (max - min + 1) * 1000
  ) / 1000;
}

export async function startMining(userId) {
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

    const activeResult = await client.query(
      `
      SELECT id, started_at
      FROM mining_sessions
      WHERE user_id = $1
        AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
      `,
      [userId]
    );

    if (activeResult.rows[0]) {
      throw new Error("Mining is already active.");
    }

    const recentResult = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM mining_sessions
      WHERE user_id = $1
        AND status = 'completed'
        AND completed_at >= NOW() - INTERVAL '6 hours'
      `,
      [userId]
    );

    if (
      recentResult.rows[0].count >=
      CONFIG.mining.maxSessions
    ) {
      throw new Error(
        "Mining limit reached. Try again after the cooldown."
      );
    }

    const insertResult = await client.query(
      `
      INSERT INTO mining_sessions (
        user_id,
        started_at,
        status
      )
      VALUES ($1, NOW(), 'active')
      RETURNING id, started_at
      `,
      [userId]
    );

    await client.query("COMMIT");

    return {
      sessionId: insertResult.rows[0].id,
      startedAt: insertResult.rows[0].started_at,
      durationSeconds: CONFIG.mining.durationSeconds
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function completeMining(userId, sessionId) {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const sessionResult = await client.query(
      `
      SELECT
        id,
        user_id,
        started_at,
        status
      FROM mining_sessions
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE
      `,
      [sessionId, userId]
    );

    const session = sessionResult.rows[0];

    if (!session) {
      throw new Error("Mining session not found.");
    }

    if (session.status !== "active") {
      throw new Error("Mining session is not active.");
    }

    const startedAt = new Date(session.started_at).getTime();
    const now = Date.now();

    if (now - startedAt < MINING_DURATION_MS) {
      const remainingSeconds = Math.ceil(
        (MINING_DURATION_MS - (now - startedAt)) / 1000
      );

      throw new Error(
        `Mining is not finished. ${remainingSeconds} seconds remaining.`
      );
    }

    const reward = randomReward();

    await client.query(
      `
      UPDATE mining_sessions
      SET
        completed_at = NOW(),
        reward = $1,
        status = 'completed'
      WHERE id = $2
      `,
      [reward, sessionId]
    );

    await client.query(
      `
      UPDATE users
      SET
        balance = balance + $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [reward, userId]
    );

    await client.query(
      `
      INSERT INTO wallet_ledger (
        user_id,
        amount,
        type,
        reference_id
      )
      VALUES ($1, $2, 'mining_reward', $3)
      `,
      [userId, reward, String(sessionId)]
    );

    await client.query("COMMIT");

    return {
      sessionId,
      reward,
      token: CONFIG.app.tokenSymbol
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
