import { reviewApi as api } from './config.js';
const list = document.querySelector('#reviews-list');
const listStatus = document.querySelector('#list-status');
const form = document.querySelector('#review-form');
const status = document.querySelector('#form-status');
const submit = form.querySelector('button[type=submit]');
const photoInput = document.querySelector('#review-photo');
const maxPhotoBytes = 360000;
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
  const { reviews, photoUploads } = await response.json();
  if (photoUploads) {
    photoInput.disabled = false;
    document.querySelector('#review-photo-field').hidden = false;
  }
  listStatus.hidden = reviews.length > 0;
  listStatus.textContent = 'Здесь появятся отзывы после проверки.';
  for (const { id, name, product, rating, body, has_photo } of reviews) {
    const card = node('article', '', 'review-card');
    const heading = node('header', '');
    const stars = node('span', '★'.repeat(rating) + '☆'.repeat(5 - rating), 'review-rating');
    stars.setAttribute('aria-label', `Оценка ${rating} из 5`);
    heading.append(node('h3', name), stars);
    card.append(heading);
    if (product) card.append(node('p', product, 'muted'));
    card.append(node('p', body, 'review-text'));
    if (has_photo) {
      const url = `${api}/reviews/${encodeURIComponent(id)}/photo`;
      const link = node('a', '');
      link.href = url;
      const photo = node('img', '', 'review-photo');
      photo.src = url;
      photo.alt = 'Фото к отзыву';
      photo.loading = 'lazy';
      link.append(photo);
      card.append(link);
    }
    list.append(card);
  }
}

loadReviews().catch(() => {
  listStatus.textContent = 'Отзывы сейчас не загрузились. Попробуйте обновить страницу позже.';
});

async function preparePhoto(file) {
  if (file.size > 15 * 1000 * 1000) throw new Error('Выберите фото до 15 МБ.');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Не удалось открыть фото. Выберите JPG, PNG или WebP.');
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  try {
    for (const [maxSide, quality] of [[1280, 0.84], [1280, 0.68], [960, 0.62]]) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', quality);
      if (data.startsWith('data:image/jpeg;base64,')) {
        const encoded = data.slice('data:image/jpeg;base64,'.length);
        if (encoded.length <= maxPhotoBytes / 3 * 4) return encoded;
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error('Не удалось уменьшить фото. Попробуйте другое изображение.');
}

let requestId = crypto.randomUUID();
form.addEventListener('input', () => { requestId = crypto.randomUUID(); });
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled) return;
  const payload = Object.fromEntries(new FormData(form));
  const photo = photoInput.files[0];
  payload.rating = Number(payload.rating);
  payload.id = requestId;
  submit.disabled = true;
  status.removeAttribute('data-error');
  status.textContent = 'Отправляем…';
  try {
    if (photo) payload.photo = await preparePhoto(photo);
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
