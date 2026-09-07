import { getDb } from "./db.js";
import { CONFIG } from "./config.js";

const TASK_COOLDOWN_MS =
  CONFIG.tasks.cooldownHours * 60 * 60 * 1000;

export async function getActiveTasks() {
  const db = getDb();

  const result = await db.query(`
    SELECT
      id,
      task_key,
      title,
      description,
      reward,
      task_type,
      target,
      cooldown_seconds
    FROM tasks
    WHERE active = TRUE
    ORDER BY id ASC
  `);

  return result.rows;
}

export async function canClaimTask(userId, taskId) {
  const db = getDb();

  const result = await db.query(
    `
    SELECT claimed_at
    FROM task_claims
    WHERE user_id = $1
      AND task_id = $2
    ORDER BY claimed_at DESC
    LIMIT 1
    `,
    [userId, taskId]
  );

  if (!result.rows[0]) {
    return {
      allowed: true,
      remainingSeconds: 0
    };
  }

  const lastClaim = new Date(
    result.rows[0].claimed_at
  ).getTime();

  const remainingMs =
    lastClaim + TASK_COOLDOWN_MS - Date.now();

  if (remainingMs <= 0) {
    return {
      allowed: true,
      remainingSeconds: 0
    };
  }

  return {
    allowed: false,
    remainingSeconds: Math.ceil(remainingMs / 1000)
  };
}

export async function claimTask(userId, taskId) {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const taskResult = await client.query(
      `
      SELECT
        id,
        task_key,
        reward,
        active
      FROM tasks
      WHERE id = $1
      FOR UPDATE
      `,
      [taskId]
    );

    const task = taskResult.rows[0];

    if (!task || !task.active) {
      throw new Error("Task is not available.");
    }

    const cooldownResult = await client.query(
      `
      SELECT claimed_at
      FROM task_claims
      WHERE user_id = $1
        AND task_id = $2
      ORDER BY claimed_at DESC
      LIMIT 1
      `,
      [userId, taskId]
    );

    if (cooldownResult.rows[0]) {
      const lastClaim = new Date(
        cooldownResult.rows[0].claimed_at
      ).getTime();

      if (Date.now() - lastClaim < TASK_COOLDOWN_MS) {
        throw new Error(
          "This task is still on cooldown."
        );
      }
    }

    const reward = Number(task.reward);

    await client.query(
      `
      INSERT INTO task_claims (
        user_id,
        task_id,
        reward
      )
      VALUES ($1, $2, $3)
      `,
      [userId, taskId, reward]
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
      VALUES ($1, $2, 'task_reward', $3)
      `,
      [userId, reward, String(taskId)]
    );

    await client.query("COMMIT");

    return {
      taskId,
      taskKey: task.task_key,
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
