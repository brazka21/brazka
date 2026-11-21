const reviewFields = 'id, name, product, rating, body, created_at';
const idPattern = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;

function reply(env, data, status = 200) {
  return new Response(data === null ? null : JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': env.SITE_ORIGIN,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

async function authenticated(request, secret) {
  const header = request.headers.get('authorization') || '';
  if (!secret || !header.startsWith('Bearer ') || header.length > 512) return false;
  const encoder = new TextEncoder();
  const digest = async (value) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  const [actual, expected] = await Promise.all([digest(header.slice(7)), digest(secret)]);
  return actual.reduce((difference, byte, i) => difference | (byte ^ expected[i]), 0) === 0;
}

async function readJSON(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json') || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return JSON.parse(text + decoder.decode());
      bytes += value.byteLength;
      if (bytes > 8192) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    return null;
  }
}

async function notifyOwner(env, id) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
      text: 'БРАЗКА · Новый отзыв ожидает проверки',
      reply_markup: { inline_keyboard: [[{
        text: 'Открыть модерацию',
        url: `${env.SITE_ORIGIN}/reviews/moderation/#${id}`,
      }]] },
    }),
  });
  if (!response.ok) throw new Error('Telegram notification failed');
}

export default {
  async fetch(request, env, context) {
    const path = new URL(request.url).pathname;
    const method = request.method;
    const origin = request.headers.get('origin');
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const respond = (data, status) => reply(env, data, status);
    if (origin && origin !== env.SITE_ORIGIN) return respond({ error: 'origin' }, 403);
    if (method === 'OPTIONS') return respond(null, 204);

    try {
      if (path === '/reviews' && method === 'GET') {
        const { results } = await env.DB.prepare(`SELECT ${reviewFields}
          FROM reviews WHERE status = 'approved' ORDER BY created_at DESC, id DESC LIMIT 100`).all();
        return respond({ reviews: results });
      }

      if (path === '/reviews' && method === 'POST') {
        const { success } = await env.SUBMISSIONS.limit({ key: ip });
        if (!success) return respond({ error: 'rate_limit' }, 429);

        const data = await readJSON(request);
        const { id, name, product = '', rating, body, website } = data || {};
        if (website) return respond({ ok: true }, 202);
        if (typeof id !== 'string' || !idPattern.test(id) ||
            typeof name !== 'string' || !name.trim() || name.length > 40 ||
            typeof product !== 'string' || product.length > 100 ||
            !Number.isInteger(rating) || rating < 1 || rating > 5 ||
            typeof body !== 'string' || body.trim().length < 10 || body.length > 1200) {
          return respond({ error: 'invalid_review' }, 400);
        }

        const insert = await env.DB.prepare(`INSERT INTO reviews (id, name, product, rating, body)
          VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`)
          .bind(id.toLowerCase(), name.trim(), product.trim(), rating, body.trim()).run();
        if (insert.meta.changes && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_ADMIN_CHAT_ID) {
          context.waitUntil(notifyOwner(env, id).catch(() => console.error('Review notification failed')));
        }
        return respond({ ok: true }, 202);
      }

      if (path === '/moderation' || path.startsWith('/moderation/')) {
        if (!(await authenticated(request, env.REVIEWS_ADMIN_KEY))) {
          const { success } = await env.ADMIN_ATTEMPTS.limit({ key: ip });
          return respond({ error: 'authorization' }, success ? 401 : 429);
        }

        if (path === '/moderation' && method === 'GET') {
          const { results } = await env.DB.prepare(`SELECT ${reviewFields}
            FROM reviews WHERE status = 'pending' ORDER BY created_at ASC, id ASC LIMIT 100`).all();
          return respond({ reviews: results });
        }

        const id = path.slice('/moderation/'.length);
        if (method === 'POST' && idPattern.test(id)) {
          const data = await readJSON(request);
          if (!['approved', 'rejected'].includes(data?.status)) return respond({ error: 'invalid_status' }, 400);
          const result = await env.DB.prepare(`UPDATE reviews SET status = ?,
            moderated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = 'pending'`)
            .bind(data.status, id.toLowerCase()).run();
          return result.meta.changes ? respond({ ok: true }) : respond({ error: 'not_pending' }, 409);
        }
      }

      return respond({ error: 'not_found' }, 404);
    } catch {
      return respond({ error: 'service_unavailable' }, 503);
    }
  },
};
