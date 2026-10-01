'use strict';
(() => {
  const track = (goal, params) => { if (typeof window.ym === 'function') window.ym(112697107, 'reachGoal', goal, params); };
  track('news_page_view', {article: location.pathname});
  document.querySelectorAll('main img').forEach(image => image.addEventListener('error', () => { if (!image.dataset.fallback) { image.dataset.fallback = '1'; image.src = '/assets/og-image-v2.jpg'; image.alt = 'BRAZKA — Новости PlayStation'; } }));
  document.querySelectorAll('[data-news-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-news-filter]').forEach(other => { other.classList.toggle('active', other === button); other.setAttribute('aria-pressed', String(other === button)); });
    document.querySelectorAll('[data-news-category]').forEach(card => { card.hidden = button.dataset.newsFilter !== 'Все' && card.dataset.newsCategory !== button.dataset.newsFilter; });
  }));
  document.querySelectorAll('[data-news-product]').forEach(link => link.addEventListener('click', () => track('news_product_click', {article: location.pathname, destination: link.getAttribute('href')})));
  function cartCount() {
    try { const items = JSON.parse(localStorage.getItem('brazka-cart-v1') || '[]'); const count = Array.isArray(items) ? Math.min(items.length, 12) : 0; document.getElementById('cartCount').textContent = count; document.querySelector('.cart-button')?.classList.toggle('has-items', count > 0); } catch {}
  }
  cartCount(); window.addEventListener('storage', cartCount);
  const products = [...document.querySelectorAll('[data-product]')].filter(p => !['plus', 'catalog'].includes(p.dataset.product));
  if (!products.length) return;
  const money = p => p == null ? 'Уточнить цену' : 'от ' + new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
  fetch('/games.json', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('catalog'); return r.json(); }).then(data => {
    const editions = data.groups.flatMap(g => g.games);
    products.forEach(product => {
      const values = editions.filter(e => e.gameId === product.dataset.product && e.availability?.turkey !== 'unavailable' && (!e.discounts?.turkey?.endsAt || Date.parse(e.discounts.turkey.endsAt) > Date.now())).map(e => e.prices?.turkey).filter(p => Number.isFinite(p) && p > 0);
      product.querySelector('[data-news-price]').textContent = money(values.length ? Math.min(...values) : null);
    });
  }).catch(() => products.forEach(product => { product.querySelector('[data-news-price]').textContent = 'Уточнить цену'; }));
})();
