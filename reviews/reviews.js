import { reviewApi as api } from './config.js';
const list = document.querySelector('#reviews-list');
const listStatus = document.querySelector('#list-status');
const form = document.querySelector('#review-form');
const status = document.querySelector('#form-status');
const submit = form.querySelector('button[type=submit]');
submit.disabled = false;

function node(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

async function loadReviews() {
  const response = await fetch(`${api}/reviews`);
  if (!response.ok) throw new Error('Reviews unavailable');
  const { reviews } = await response.json();
  listStatus.hidden = reviews.length > 0;
  listStatus.textContent = 'Здесь появятся отзывы после проверки.';
  for (const { name, product, rating, body } of reviews) {
    const card = node('article', '', 'review-card');
    const heading = node('header', '');
    const stars = node('span', '★'.repeat(rating) + '☆'.repeat(5 - rating), 'review-rating');
    stars.setAttribute('aria-label', `Оценка ${rating} из 5`);
    heading.append(node('h3', name), stars);
    card.append(heading);
    if (product) card.append(node('p', product, 'muted'));
    card.append(node('p', body, 'review-text'));
    list.append(card);
  }
}

loadReviews().catch(() => {
  listStatus.textContent = 'Отзывы сейчас не загрузились. Попробуйте обновить страницу позже.';
});

let requestId = crypto.randomUUID();
form.addEventListener('input', () => { requestId = crypto.randomUUID(); });
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled) return;
  const payload = Object.fromEntries(new FormData(form));
  payload.rating = Number(payload.rating);
  payload.id = requestId;
  submit.disabled = true;
  status.removeAttribute('data-error');
  status.textContent = 'Отправляем…';
  try {
    const response = await fetch(`${api}/reviews`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.status === 429) throw new Error('Слишком много попыток. Подождите минуту и попробуйте снова.');
    if (!response.ok) throw new Error('Отзыв не отправился. Проверьте поля и попробуйте ещё раз.');
    if (requestId === payload.id) form.reset();
    requestId = crypto.randomUUID();
    status.textContent = 'Спасибо! Отзыв отправлен на проверку.';
  } catch (error) {
    status.dataset.error = '';
    status.textContent = error instanceof TypeError ? 'Связь прервалась. Попробуйте отправить отзыв ещё раз.' : error.message;
  } finally {
    submit.disabled = false;
    status.focus();
  }
});
