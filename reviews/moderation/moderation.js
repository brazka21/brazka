import { reviewApi } from '../config.js';

const form = document.querySelector('#moderation-login');
const input = document.querySelector('#moderation-key');
const status = document.querySelector('#moderation-status');
const list = document.querySelector('#moderation-list');
const actions = document.querySelector('#moderation-actions');
let session = null;

async function call(current, path, fields) {
  const headers = { authorization: `Bearer ${current.key}` };
  if (fields) headers['content-type'] = 'application/json';
  const response = await fetch(`${reviewApi}${path}`, {
    headers,
    method: fields ? 'POST' : 'GET',
    body: fields ? JSON.stringify(fields) : undefined,
  });
  if (response.status === 401) throw new Error('Проверьте ключ модератора.');
  if (response.status === 429) throw new Error('Слишком много попыток. Повторите позже.');
  if (response.status === 409) throw new Error('Отзыв уже обработан. Обновите очередь.');
  if (!response.ok) throw new Error('Сервис недоступен. Попробуйте позже.');
  return response.json();
}

function element(tag, text, className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = className;
  return node;
}

async function loadPhoto(current, id, container) {
  try {
    const response = await fetch(`${reviewApi}/moderation/${encodeURIComponent(id)}/photo`, {
      headers: { authorization: `Bearer ${current.key}` },
    });
    if (!response.ok) throw new Error('Photo unavailable');
    const blob = await response.blob();
    if (current !== session || !container.isConnected) return;
    const url = URL.createObjectURL(blob);
    const image = element('img', '', 'review-photo');
    image.alt = 'Фото к отзыву';
    image.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
    image.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      container.textContent = 'Фото не загрузилось.';
    }, { once: true });
    image.src = url;
    container.replaceChildren(image);
  } catch {
    container.textContent = 'Фото не загрузилось.';
  }
}

function render(current, reviews) {
  list.replaceChildren();
  status.textContent = reviews.length ? `Ожидают проверки: ${reviews.length}` : 'Новых отзывов пока нет.';
  const requestedId = location.hash.slice(1);
  for (const review of reviews) {
    const card = element('article', '', 'review-card');
    const product = review.product ? ` · ${review.product}` : '';
    card.id = review.id;
    card.append(
      element('h2', review.name),
      element('p', `${review.rating} из 5${product}`, 'muted'),
      element('p', review.body, 'review-text'),
    );
    if (review.has_photo) {
      const photo = element('div', 'Загружаем фото…', 'muted');
      card.append(photo);
      void loadPhoto(current, review.id, photo);
    }
    const buttons = element('div', '', 'moderation-buttons');
    for (const [nextStatus, label, style] of [['approved', 'Опубликовать', 'primary'], ['rejected', 'Отклонить', 'secondary']]) {
      const button = element('button', label, `button ${style}`);
      button.type = 'button';
      button.addEventListener('click', async () => {
        for (const control of buttons.children) control.disabled = true;
        try {
          await call(current, `/moderation/${review.id}`, { status: nextStatus });
          if (current !== session) return;
          await load(current);
          if (current === session) status.textContent = nextStatus === 'approved' ? 'Отзыв опубликован.' : 'Отзыв отклонён.';
        } catch (error) {
          if (current === session) status.textContent = error.message;
          for (const control of buttons.children) control.disabled = false;
        }
      });
      buttons.append(button);
    }
    card.append(buttons);
    list.append(card);
    if (review.id === requestedId) requestAnimationFrame(() => card.scrollIntoView());
  }
}

async function load(current) {
  try {
    const { reviews } = await call(current, '/moderation');
    if (current !== session) return;
    form.hidden = true;
    input.value = '';
    actions.hidden = false;
    render(current, reviews);
  } catch (error) {
    if (current === session) status.textContent = error.message;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  session = { key: input.value.trim() };
  load(session);
});
document.querySelector('#moderation-refresh').addEventListener('click', () => load(session));
document.querySelector('#moderation-logout').addEventListener('click', () => {
  session = null;
  list.replaceChildren();
  form.hidden = false;
  actions.hidden = true;
  status.textContent = '';
  input.focus();
});
