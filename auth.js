import crypto from "node:crypto";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required.");
}

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

export function validateTelegramInitData(initData) {
  if (typeof initData !== "string" || !initData.trim()) {
    throw new Error("Telegram initData is required.");
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));

  if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) {
    throw new Error("Invalid Telegram authentication hash.");
  }

  if (!Number.isInteger(authDate)) {
    throw new Error("Invalid Telegram authentication date.");
  }

  const now = Math.floor(Date.now() / 1000);

  if (authDate > now + 60 || now - authDate > MAX_AUTH_AGE_SECONDS) {
    throw new Error("Telegram authentication data has expired.");
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const valid = crypto.timingSafeEqual(
    Buffer.from(calculatedHash, "hex"),
    Buffer.from(receivedHash, "hex")
  );

  if (!valid) {
    throw new Error("Invalid Telegram authentication data.");
  }

  const userRaw = params.get("user");

  if (!userRaw) {
    throw new Error("Telegram user data is missing.");
  }

  let user;

  try {
    user = JSON.parse(userRaw);
  } catch {
    throw new Error("Invalid Telegram user data.");
  }

  if (!user?.id) {
    throw new Error("Telegram user ID is missing.");
  }

  return {
    telegramId: String(user.id),
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null
  };
    }
