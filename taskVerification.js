import { getChatMember } from "./telegram.js";

const ZAKSH_CHANNEL = "@ZAKASMINER";

export async function verifyChannelMembership(telegramUserId) {
  const member = await getChatMember(
    ZAKSH_CHANNEL,
    telegramUserId
  );

  const validStatuses = new Set([
    "creator",
    "administrator",
    "member"
  ]);

  return validStatuses.has(member.status);
}

export async function verifyTask(task, telegramUserId) {
  if (task.task_type === "telegram_channel_join") {
    const verified = await verifyChannelMembership(
      telegramUserId
    );

    return {
      verified,
      reason: verified
        ? "Channel membership verified."
        : "User is not a member of the channel."
    };
  }

  if (task.task_type === "telegram_channel_reaction") {
    return {
      verified: false,
      reason:
        "Reaction verification requires a specific Telegram channel post."
    };
  }

  if (task.task_type === "advertisement") {
    return {
      verified: false,
      reason:
        "Advertisement verification is not connected yet."
    };
  }

  if (task.task_type === "referral") {
    return {
      verified: false,
      reason:
        "Referral verification is handled by the referral system."
    };
  }

  return {
    verified: false,
    reason: "Unsupported task type."
  };
}
