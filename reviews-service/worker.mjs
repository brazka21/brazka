const reviewFields = 'id, name, product, rating, body, created_at';
const idPattern = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
const maxEncodedPhoto = 480000;
const initializedDatabases = new WeakSet();
const photoFlag = 'EXISTS (SELECT 1 FROM review_photos WHERE review_id = reviews.id) AS has_photo';

async function ensurePhotoTable(db) {
  if (initializedDatabases.has(db)) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS review_photos (
    review_id TEXT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    jpeg_base64 TEXT NOT NULL
  )`).run();
  initializedDatabases.add(db);
}

function decodePhoto(photo) {
  return Uint8Array.from(atob(photo), (byte) => byte.charCodeAt(0));
}

function validPhoto(photo) {
  if (typeof photo !== 'string' || photo.length > maxEncodedPhoto ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(photo) || photo.length % 4 !== 0) return false;
  const bytes = decodePhoto(photo);
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff &&
    bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
}

async function reviewPhoto(env, id, status) {
  await ensurePhotoTable(env.DB);
  const row = await env.DB.prepare(`SELECT jpeg_base64 FROM review_photos
    JOIN reviews ON reviews.id = review_photos.review_id
    WHERE review_id = ? AND status = ?`).bind(id.toLowerCase(), status).first();
  if (!row) return reply(env, { error: 'not_found' }, 404);
  return new Response(decodePhoto(row.jpeg_base64), {
    headers: {
      'content-type': 'image/jpeg',
      'access-control-allow-origin': env.SITE_ORIGIN,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

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

async function readJSON(request, maxBytes = 8192) {
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
      if (bytes > maxBytes) {
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
        await ensurePhotoTable(env.DB);
        const { results } = await env.DB.prepare(`SELECT ${reviewFields}, ${photoFlag}
          FROM reviews WHERE status = 'approved' ORDER BY created_at DESC, id DESC LIMIT 100`).all();
        return respond({ reviews: results, photoUploads: true });
      }

      if (method === 'GET') {
        const match = /^\/reviews\/([^/]+)\/photo$/.exec(path);
        if (match && idPattern.test(match[1])) return await reviewPhoto(env, match[1], 'approved');
      }

      if (path === '/reviews' && method === 'POST') {
        const { success } = await env.SUBMISSIONS.limit({ key: ip });
        if (!success) return respond({ error: 'rate_limit' }, 429);

        const data = await readJSON(request, maxEncodedPhoto + 8192);
        const { id, name, product = '', rating, body, website, photo } = data || {};
        if (website) return respond({ ok: true }, 202);
        if (typeof id !== 'string' || !idPattern.test(id) ||
            typeof name !== 'string' || !name.trim() || name.length > 40 ||
            typeof product !== 'string' || product.length > 100 ||
            !Number.isInteger(rating) || rating < 1 || rating > 5 ||
            typeof body !== 'string' || body.trim().length < 10 || body.length > 1200) {
          return respond({ error: 'invalid_review' }, 400);
        }

        if (photo !== undefined && !validPhoto(photo)) return respond({ error: 'invalid_photo' }, 400);
        const reviewId = id.toLowerCase();
        const reviewInsert = env.DB.prepare(`INSERT INTO reviews (id, name, product, rating, body)
          VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`)
          .bind(reviewId, name.trim(), product.trim(), rating, body.trim());
        let insert;
        if (photo !== undefined) {
          await ensurePhotoTable(env.DB);
          const photoInsert = env.DB.prepare(`INSERT INTO review_photos (review_id, jpeg_base64)
            SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE id = ?)`)
            .bind(reviewId, photo, reviewId);
          [, insert] = await env.DB.batch([photoInsert, reviewInsert]);
        } else {
          insert = await reviewInsert.run();
        }
        if (insert.meta.changes && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_ADMIN_CHAT_ID) {
          context.waitUntil(notifyOwner(env, reviewId).catch(() => console.error('Review notification failed')));
        }
        return respond({ ok: true }, 202);
      }

      if (path === '/moderation' || path.startsWith('/moderation/')) {
        if (!(await authenticated(request, env.REVIEWS_ADMIN_KEY))) {
          const { success } = await env.ADMIN_ATTEMPTS.limit({ key: ip });
          return respond({ error: 'authorization' }, success ? 401 : 429);
        }

        if (path === '/moderation' && method === 'GET') {
          await ensurePhotoTable(env.DB);
          const { results } = await env.DB.prepare(`SELECT ${reviewFields}, ${photoFlag}
            FROM reviews WHERE status = 'pending' ORDER BY created_at ASC, id ASC LIMIT 100`).all();
          return respond({ reviews: results });
        }

        if (method === 'GET') {
          const match = /^\/moderation\/([^/]+)\/photo$/.exec(path);
          if (match && idPattern.test(match[1])) return await reviewPhoto(env, match[1], 'pending');
        }

        const id = path.slice('/moderation/'.length);
        if (method === 'POST' && idPattern.test(id)) {
          const data = await readJSON(request);
          if (!['approved', 'rejected'].includes(data?.status)) return respond({ error: 'invalid_status' }, 400);
          const update = env.DB.prepare(`UPDATE reviews SET status = ?,
            moderated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = 'pending'`)
            .bind(data.status, id.toLowerCase());
          let result;
          if (data.status === 'rejected') {
            await ensurePhotoTable(env.DB);
            const removePhoto = env.DB.prepare(`DELETE FROM review_photos WHERE review_id = ?
              AND EXISTS (SELECT 1 FROM reviews WHERE id = ? AND status = 'rejected')`)
              .bind(id.toLowerCase(), id.toLowerCase());
            [result] = await env.DB.batch([update, removePhoto]);
          } else {
            result = await update.run();
          }
          return result.meta.changes ? respond({ ok: true }) : respond({ error: 'not_pending' }, 409);
        }
      }

      return respond({ error: 'not_found' }, 404);
    } catch {
      return respond({ error: 'service_unavailable' }, 503);
    }
  },
};
