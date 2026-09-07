import { getDb } from "./db.js";
import { TASK_CONFIG } from "./taskConfig.js";

export async function seedTasks() {
  const db = getDb();

  for (const task of TASK_CONFIG) {
    await db.query(
      `
      INSERT INTO tasks (
        task_key,
        title,
        description,
        reward,
        task_type,
        target,
        cooldown_seconds,
        active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (task_key)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        reward = EXCLUDED.reward,
        task_type = EXCLUDED.task_type,
        target = EXCLUDED.target,
        cooldown_seconds = EXCLUDED.cooldown_seconds,
        active = EXCLUDED.active
      `,
      [
        task.taskKey,
        task.title,
        task.description,
        task.reward,
        task.taskType,
        task.target,
        task.cooldownSeconds,
        task.active
      ]
    );
  }

  console.log(`Seeded ${TASK_CONFIG.length} ZAKSH tasks.`);
}
