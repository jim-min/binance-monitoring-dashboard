const read = (key, fallback = "") => process.env[key] ?? fallback;

export const env = {
  appEnv: read("APP_ENV", "local"),
  apiPort: Number(read("API_PORT", "8787")),
  binanceApiKey: read("BINANCE_API_KEY"),
  binanceApiSecret: read("BINANCE_API_SECRET"),
  telegramBotToken: read("TELEGRAM_BOT_TOKEN"),
  telegramChatId: read("TELEGRAM_CHAT_ID"),
};

export const configStatus = () => ({
  appEnv: env.appEnv,
  hasBinanceApiKey: Boolean(env.binanceApiKey),
  hasBinanceApiSecret: Boolean(env.binanceApiSecret),
  hasTelegramBotToken: Boolean(env.telegramBotToken),
  hasTelegramChatId: Boolean(env.telegramChatId),
});
