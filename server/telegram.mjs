import { env } from "./env.mjs";

const TELEGRAM_LIMIT = 4000;

const splitMessage = (text) => {
  const chunks = [];
  for (let index = 0; index < text.length; index += TELEGRAM_LIMIT) {
    chunks.push(text.slice(index, index + TELEGRAM_LIMIT));
  }
  return chunks.length > 0 ? chunks : [""];
};

export async function sendTelegramMessage(text) {
  if (!env.telegramBotToken || !env.telegramChatId) {
    return {
      ok: false,
      error: "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required",
    };
  }

  const chunks = splitMessage(text);
  const results = [];

  for (const chunk of chunks) {
    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chat_id: env.telegramChatId,
        text: chunk,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const payload = await response.json();
    results.push(payload);

    if (!payload.ok) {
      return {
        ok: false,
        error: payload.description ?? "Telegram send failed",
        results,
      };
    }
  }

  return {
    ok: true,
    results,
  };
}
