from __future__ import annotations

import html
import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"


def load_env(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env(ENV_PATH)

BOT_TOKEN = os.getenv("BRAZKA_BOT_TOKEN", "").strip()
ADMIN_CHAT_ID = os.getenv("BRAZKA_ADMIN_CHAT_ID", "").strip()
WEBAPP_URL = os.getenv("BRAZKA_WEBAPP_URL", "https://brazka.shop/app/").strip()

if not BOT_TOKEN:
    raise SystemExit(
        "Не указан BRAZKA_BOT_TOKEN. Скопируйте .env.example в .env и вставьте токен бота."
    )

API_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)


def api_call(method: str, payload: dict[str, Any] | None = None, timeout: int = 65) -> dict[str, Any]:
    payload = payload or {}
    encoded: dict[str, str] = {}

    for key, value in payload.items():
        if value is None:
            continue
        if isinstance(value, (dict, list, tuple)):
            encoded[key] = json.dumps(value, ensure_ascii=False)
        elif isinstance(value, bool):
            encoded[key] = "true" if value else "false"
        else:
            encoded[key] = str(value)

    data = urllib.parse.urlencode(encoded).encode("utf-8")
    request = urllib.request.Request(
        f"{API_BASE}/{method}",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Telegram HTTP {error.code}: {body}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Нет соединения с Telegram: {error.reason}") from error

    if not result.get("ok"):
        raise RuntimeError(f"Telegram API error: {result}")

    return result


def send_message(
    chat_id: str | int,
    text: str,
    *,
    reply_markup: dict[str, Any] | None = None,
    parse_mode: str | None = None,
) -> None:
    payload: dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": True,
    }

    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    if parse_mode:
        payload["parse_mode"] = parse_mode

    api_call("sendMessage", payload, timeout=25)


def webapp_keyboard() -> dict[str, Any]:
    return {
        "keyboard": [
            [
                {
                    "text": "🛒 Открыть магазин",
                    "web_app": {"url": WEBAPP_URL},
                }
            ]
        ],
        "resize_keyboard": True,
        "is_persistent": True,
        "input_field_placeholder": "Нажмите кнопку и оформите заявку",
    }


def safe(value: Any, max_length: int = 500) -> str:
    text = str(value or "—").strip()
    if not text:
        text = "—"
    return html.escape(text[:max_length])


def format_order(payload: dict[str, Any], sender: dict[str, Any]) -> str:
    sender_name = " ".join(
        part for part in [sender.get("first_name"), sender.get("last_name")] if part
    ).strip()
    sender_username = sender.get("username")
    telegram_contact = f"@{sender_username}" if sender_username else f"ID {sender.get('id', '—')}"

    return (
        "🛒 <b>Новая заявка BRAZKA</b>\n\n"
        f"<b>Услуга:</b> {safe(payload.get('service'))}\n"
        f"<b>Регион:</b> {safe(payload.get('region'))}\n"
        f"<b>Товар:</b> {safe(payload.get('product'))}\n\n"
        f"<b>Клиент:</b> {safe(payload.get('name') or sender_name)}\n"
        f"<b>Контакт:</b> {safe(payload.get('contact') or telegram_contact)}\n"
        f"<b>Telegram:</b> {safe(telegram_contact)}\n"
        f"<b>Комментарий:</b> {safe(payload.get('comment'))}\n\n"
        f"<b>User ID:</b> <code>{safe(sender.get('id'))}</code>"
    )


def handle_webapp_data(message: dict[str, Any]) -> None:
    chat = message.get("chat") or {}
    sender = message.get("from") or {}
    chat_id = chat.get("id")
    raw_data = (message.get("web_app_data") or {}).get("data", "")

    if not chat_id:
        return

    try:
        payload = json.loads(raw_data)
    except json.JSONDecodeError:
        send_message(chat_id, "Не смог разобрать заявку. Попробуйте оформить её ещё раз.")
        logging.warning("Некорректный web_app_data: %r", raw_data)
        return

    if not isinstance(payload, dict) or payload.get("type") != "brazka_order":
        send_message(chat_id, "Получены неизвестные данные. Попробуйте открыть магазин заново.")
        logging.warning("Неизвестный payload: %r", payload)
        return

    admin_target = ADMIN_CHAT_ID or str(chat_id)
    order_text = format_order(payload, sender)

    send_message(admin_target, order_text, parse_mode="HTML")
    send_message(
        chat_id,
        "✅ Заявка принята. Менеджер BRAZKA скоро свяжется с вами.",
        reply_markup=webapp_keyboard(),
    )
    logging.info("Новая заявка от Telegram user_id=%s", sender.get("id"))


def handle_message(message: dict[str, Any]) -> None:
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    text = str(message.get("text") or "").strip()

    if not chat_id:
        return

    if message.get("web_app_data"):
        handle_webapp_data(message)
        return

    if text.startswith("/start"):
        send_message(
            chat_id,
            "Привет! Это BRAZKA SHOP. Нажмите кнопку ниже, выберите услугу и отправьте заявку.",
            reply_markup=webapp_keyboard(),
        )
        return

    if text.startswith("/id"):
        send_message(
            chat_id,
            f"Ваш chat ID: <code>{html.escape(str(chat_id))}</code>",
            parse_mode="HTML",
        )
        return

    send_message(
        chat_id,
        "Для оформления заявки нажмите «🛒 Открыть магазин».",
        reply_markup=webapp_keyboard(),
    )


def main() -> None:
    me = api_call("getMe", timeout=25)["result"]
    logging.info("Бот запущен: @%s", me.get("username"))
    logging.info("Mini App: %s", WEBAPP_URL)
    logging.info("Админ: %s", ADMIN_CHAT_ID or "не задан — тестовые заявки вернутся отправителю")

    offset = 0

    while True:
        try:
            updates = api_call(
                "getUpdates",
                {
                    "offset": offset,
                    "timeout": 50,
                    "allowed_updates": ["message"],
                },
                timeout=60,
            )["result"]

            for update in updates:
                offset = int(update["update_id"]) + 1
                message = update.get("message")
                if message:
                    handle_message(message)

        except KeyboardInterrupt:
            logging.info("Бот остановлен пользователем")
            break
        except Exception:
            logging.exception("Ошибка в цикле бота")
            time.sleep(5)


if __name__ == "__main__":
    main()
