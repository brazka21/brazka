# Отзывы БРАЗКА

GitHub Pages обслуживает /reviews/ и /reviews/moderation/. Отзывы принимает отдельный Cloudflare Worker. Он сохраняет их в D1 со статусом pending. Публичный API возвращает только approved, очередь модерации требует секрет.

## Развёртывание

Из папки reviews-service:

1. Войдите в Cloudflare через `npx wrangler login`. Создайте D1 командой `npx wrangler d1 create brazka-reviews` и запишите выданный database_id в wrangler.toml.
2. Примените миграцию командой `npx wrangler d1 migrations apply DB --remote`.
3. Разверните сервис командой `npx wrangler deploy`. Затем задайте длинный случайный ключ через `npx wrangler secret put REVIEWS_ADMIN_KEY` и сохраните его у владельца в менеджере паролей.
4. Запишите адрес развёрнутого Worker в reviews/config.js и опубликуйте ветку через GitHub Pages.
5. Проверьте полный цикл с тестовым отзывом. После отправки убедитесь, что его видно в очереди по адресу /reviews/moderation/, и отклоните его. Проверку публикации выполните на локальной копии или тестовом окружении.

Для уведомлений в Telegram установите секреты TELEGRAM_BOT_TOKEN и TELEGRAM_ADMIN_CHAT_ID. Используйте бота, которому владелец уже отправлял /start. Уведомление содержит ссылку на очередь. При сбое доставки отзыв сохраняется в очереди.

Секреты задаются только в Cloudflare. В репозиторий и в адреса страниц ключи не добавляются.
