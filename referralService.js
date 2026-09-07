import { getDb } from "./db.js";

export async function createReferral(inviterUserId, invitedUserId) {
  const db = getDb();

  if (!inviterUserId || !invitedUserId) {
    throw new Error("Both users are required.");
  }

  if (String(inviterUserId) === String(invitedUserId)) {
    throw new Error("A user cannot refer themselves.");
  }

  const users = await db.query(
    `
    SELECT id
    FROM users
    WHERE id = ANY($1::bigint[])
    `,
    [[inviterUserId, invitedUserId]]
  );

  if (users.rows.length !== 2) {
    throw new Error("Both users must exist.");
  }

  const existing = await db.query(
    `
    SELECT id
    FROM referrals
    WHERE invited_user_id = $1
    LIMIT 1
    `,
    [invitedUserId]
  );

  if (existing.rows[0]) {
    return {
      created: false,
      referralId: existing.rows[0].id
    };
  }

  const result = await db.query(
    `
    INSERT INTO referrals (
      inviter_user_id,
      invited_user_id
    )
    VALUES ($1, $2)
    RETURNING id, inviter_user_id, invited_user_id, created_at
    `,
    [inviterUserId, invitedUserId]
  );

  return {
    created: true,
    referral: result.rows[0]
  };
}

export async function getReferralStats(userId) {
  const db = getDb();

  const result = await db.query(
    `
    SELECT
      COUNT(*)::int AS invited_users
    FROM referrals
    WHERE inviter_user_id = $1
    `,
    [userId]
  );

  return {
    invitedUsers: result.rows[0]?.invited_users ?? 0
  };
}
