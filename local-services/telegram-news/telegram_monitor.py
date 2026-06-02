"""
Telegram Channel Monitor
- insidertracking: 뉴스 요약 (1시간 단위)
- highfast777: 관심 종목 알림
- shStrategy: 전체 메시지 전달
- 알림은 텔레그램 봇으로 전송
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.tl.types import Message

# ─── Setup ────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("monitor.log", encoding="utf-8", errors="replace"),
    ],
)
log = logging.getLogger(__name__)

API_ID = int(os.getenv("TELEGRAM_API_ID", "0"))
API_HASH = os.getenv("TELEGRAM_API_HASH", "")
PHONE = os.getenv("TELEGRAM_PHONE", "")
SESSION_DIR = Path("sessions")
SESSION_DIR.mkdir(exist_ok=True)
SESSION_PATH = str(SESSION_DIR / "monitor.session")

# Bot token for sending alerts
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "Tturu_news_bot")

# Your Telegram user ID (will be set after first message to bot)
# You can get this by messaging the bot and checking:
# https://api.telegram.org/bot<TOKEN>/getUpdates
MY_TELEGRAM_USER_ID = os.getenv("MY_TELEGRAM_USER_ID", "")

# Parse channel configs
CHANNEL_CONFIGS_RAW = os.getenv("CHANNEL_CONFIGS", "")
CHANNEL_CONFIGS = {}
for item in CHANNEL_CONFIGS_RAW.split(","):
    item = item.strip()
    if ":" in item:
        ch, mode = item.split(":", 1)
        CHANNEL_CONFIGS[ch.strip()] = mode.strip()

WATCHLIST = [s.strip() for s in os.getenv("WATCHLIST_STOCKS", "").split(",") if s.strip()]
SUMMARY_INTERVAL = int(os.getenv("SUMMARY_INTERVAL", "60"))

KST = timezone(timedelta(hours=9))

# ─── Message Buffers ───────────────────────────────────────
news_buffer: list[dict] = []

# ─── Bot Client (for sending) ──────────────────────────────
bot_client = None  # initialized later


async def send_via_bot(chat_id: str, text: str):
    """Send message via bot API (HTTP, no telethon needed)."""
    if not BOT_TOKEN:
        log.error("No bot token configured!")
        return
    try:
        import httpx
        # Split long messages (Telegram limit: 4096 chars)
        MAX_LEN = 4000
        chunks = [text[i:i+MAX_LEN] for i in range(0, len(text), MAX_LEN)]
        for chunk in chunks:
            async with httpx.AsyncClient(timeout=30) as http:
                resp = await http.post(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                    json={
                        "chat_id": chat_id,
                        "text": chunk,
                        "parse_mode": "Markdown",
                        "disable_web_page_preview": True,
                    },
                )
                if not resp.json().get("ok"):
                    log.error(f"Bot send failed: {resp.json()}")
        log.info(f"Bot sent message to {chat_id}")
    except Exception as e:
        log.error(f"Bot send error: {e}", exc_info=True)


async def get_my_user_id():
    """Get user ID by checking bot updates."""
    if not BOT_TOKEN:
        return ""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15) as http:
            resp = await http.get(
                f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
            )
            data = resp.json()
            if data.get("ok") and data.get("result"):
                # Get the chat ID from the last message
                for update in reversed(data["result"]):
                    if "message" in update:
                        chat_id = update["message"]["chat"]["id"]
                        log.info(f"Found user chat_id: {chat_id}")
                        return str(chat_id)
    except Exception as e:
        log.error(f"Could not get user ID: {e}")
    return ""


def save_user_id_to_env(user_id: str):
    """Save detected user ID back to .env file."""
    env_path = Path(".env")
    if not env_path.exists():
        return
    content = env_path.read_text(encoding="utf-8")
    lines = content.splitlines()
    updated = False
    for i, line in enumerate(lines):
        if line.startswith("MY_TELEGRAM_USER_ID="):
            lines[i] = f"MY_TELEGRAM_USER_ID={user_id}"
            updated = True
            break
    if not updated:
        lines.append(f"MY_TELEGRAM_USER_ID={user_id}")
    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    log.info(f"Saved MY_TELEGRAM_USER_ID={user_id} to .env")


# ─── Summarize ────────────────────────────────────────────
MAX_SUMMARY_LEN = 3500  # Telegram limit 4096, leave room for header


def summarize_messages(messages: list[dict]) -> str:
    """원문에서 첫 문단만 잘라서 보내기. LLM 요약 없이 빠르게 전달."""
    if not messages:
        return ""

    now = datetime.now(KST).strftime("%m/%d %H:%M")
    header = f"📰 미국 주식 인사이더 요약 ({now})\n총 {len(messages)}건\n\n"
    remaining = MAX_SUMMARY_LEN - len(header)

    parts = []
    for i, msg in enumerate(messages, 1):
        text = msg.get("text", "").strip()
        if not text:
            continue
        # 첫 문단만 추출 (빈 줄 기준)
        first_para = text.split("\n\n")[0].split("\n")[0].strip()
        if not first_para:
            first_para = text[:200]
        entry = f"[{i}] {first_para}"
        parts.append(entry)

    body = "\n\n".join(parts)
    if len(body) > remaining:
        body = body[:remaining] + "\n\n... (이하 생략)"

    return header + body


def check_watchlist(text: str) -> list[str]:
    matched = []
    for stock in WATCHLIST:
        if stock in text:
            matched.append(stock)
    return matched


# ─── Telethon Client (for reading channels) ────────────────
client = TelegramClient(SESSION_PATH, API_ID, API_HASH)


@client.on(events.NewMessage)
async def handle_message(event: Message):
    try:
        chat = await event.get_chat()
        username = getattr(chat, "username", "") or ""
        text = event.text or ""
        msg_time = event.date.astimezone(KST)

        log.info(f"[{username}] {text[:80]}...")

        mode = CHANNEL_CONFIGS.get(username, "")

        if mode == "summarize":
            news_buffer.append({
                "channel": username,
                "text": text,
                "time": msg_time.isoformat(),
                "id": event.id,
            })
            log.info(f"  → buffered (total: {len(news_buffer)})")

        elif mode == "watchlist":
            matched = check_watchlist(text)
            if matched:
                alert = (
                    f"🔔 관심 종목 알림\n"
                    f"채널: @{username}\n"
                    f"종목: {', '.join(matched)}\n"
                    f"시간: {msg_time.strftime('%H:%M')}\n\n"
                    f"{text[:500]}"
                )
                log.info(f"  → WATCHLIST HIT: {matched}")
                if MY_TELEGRAM_USER_ID:
                    await send_via_bot(MY_TELEGRAM_USER_ID, alert)
            else:
                log.info(f"  → no watchlist match")

        elif mode == "forward":
            forward_text = (
                f"📡 신한 리서치본부\n"
                f"시간: {msg_time.strftime('%m/%d %H:%M')}\n\n"
                f"{text}"
            )
            log.info(f"  → forwarding")
            if MY_TELEGRAM_USER_ID:
                await send_via_bot(MY_TELEGRAM_USER_ID, forward_text)

    except Exception as e:
        log.error(f"Error handling message: {e}", exc_info=True)


async def periodic_summarizer():
    global news_buffer
    while True:
        await asyncio.sleep(SUMMARY_INTERVAL * 60)
        if news_buffer:
            log.info(f"Summarizing {len(news_buffer)} messages...")
            try:
                summary = summarize_messages(news_buffer)
                if MY_TELEGRAM_USER_ID:
                    await send_via_bot(MY_TELEGRAM_USER_ID, summary)
                log.info("Summary sent!")
                news_buffer.clear()
            except Exception as e:
                log.error(f"Summarization error: {e}", exc_info=True)


async def main():
    log.info("=" * 50)
    log.info("Telegram Channel Monitor Starting")
    log.info(f"Channels: {CHANNEL_CONFIGS}")
    log.info(f"Watchlist: {WATCHLIST}")
    log.info(f"Summary interval: {SUMMARY_INTERVAL} min")
    log.info(f"Bot token: {'set' if BOT_TOKEN else 'NOT SET'}")
    log.info("=" * 50)

    await client.start(phone=PHONE)
    me = await client.get_me()
    log.info(f"Logged in as: {me.first_name}")

    # Resolve channels
    for username in CHANNEL_CONFIGS:
        try:
            entity = await client.get_entity(username)
            log.info(f"Resolved @{username} → {getattr(entity, 'title', username)}")
        except Exception as e:
            log.warning(f"Could not resolve @{username}: {e}")

    # Get user ID if not set
    global MY_TELEGRAM_USER_ID
    if not MY_TELEGRAM_USER_ID:
        log.info("No user ID set. Trying to find from bot updates...")
        log.info(f"👉 봇(@{BOT_USERNAME})에게 아무 메시지나 보내주세요!")
        MY_TELEGRAM_USER_ID = await get_my_user_id()
        if MY_TELEGRAM_USER_ID:
            log.info(f"Found user ID: {MY_TELEGRAM_USER_ID}")
            save_user_id_to_env(MY_TELEGRAM_USER_ID)
        else:
            log.warning("Could not find user ID. Messages will be logged but not sent.")

    # Start periodic summarizer
    asyncio.create_task(periodic_summarizer())

    log.info("Monitor running. Press Ctrl+C to stop.")
    await client.run_until_disconnected()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Stopped by user.")
