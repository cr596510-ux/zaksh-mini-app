const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required.");
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function telegram(method, payload = {}) {
  const response = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram API error: ${data.description || response.statusText}`
    );
  }

  return data.result;
}

export async function getChatMember(chatId, userId) {
  return telegram("getChatMember", {
    chat_id: chatId,
    user_id: userId
  });
}

export async function sendMessage(chatId, text, options = {}) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    ...options
  });
}

export async function setWebhook(url, secretToken) {
  return telegram("setWebhook", {
    url,
    secret_token: secretToken
  });
}
