const plans = {
  essential: {
    title: 'PS Plus Essential',
    note: 'Онлайн-мультиплеер, игры месяца и базовые возможности PS Plus.',
    features: ['онлайн', 'игры месяца', 'облако'],
    prices: { 1: 1090, 3: 2990, 12: 7900 }
  },
  extra: {
    title: 'PS Plus Extra',
    note: 'Каталог игр плюс все базовые преимущества PS Plus Essential.',
    features: ['каталог игр', 'онлайн', 'облако'],
    prices: { 1: 1590, 3: 4290, 12: 11990 }
  },
  deluxe: {
    title: 'PS Plus Deluxe',
    note: 'Максимальный уровень PS Plus: всё из Extra плюс пробные версии и классика.',
    features: ['классика', 'пробные версии', 'всё из Extra'],
    prices: { 1: 1790, 3: 4790, 12: 13990 }
  }
};

const TELEGRAM_URL = atob('aHR0cHM6Ly90Lm1lL20vTHlFS2psMGJPREZp');
const rub = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
let selectedPlan = 'essential';
let selectedMonths = '1';

document.querySelectorAll('[data-telegram]').forEach(link => {
  link.href = TELEGRAM_URL;
});

function renderPlan() {
  const plan = plans[selectedPlan];
  document.getElementById('selectedName').textContent = plan.title;
  document.getElementById('selectedPrice').textContent = rub(plan.prices[selectedMonths]);
  document.getElementById('selectedNote').textContent = plan.note;
  document.getElementById('featureRow').innerHTML = plan.features.map(item => `<span>${item}</span>`).join('');

  document.querySelectorAll('.plan-tile').forEach(button => {
    const active = button.dataset.plan === selectedPlan;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.duration').forEach(button => {
    const active = button.dataset.months === selectedMonths;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

document.querySelectorAll('.plan-tile').forEach(button => {
  button.addEventListener('click', () => {
    selectedPlan = button.dataset.plan;
    renderPlan();
  });
});

document.querySelectorAll('.duration').forEach(button => {
  button.addEventListener('click', () => {
    selectedMonths = button.dataset.months;
    renderPlan();
  });
});

function gameCard(game) {
  const best = Math.min(game.prices.india, game.prices.turkey);
  return `
    <article class="catalog-card reveal-card">
      <div class="catalog-cover-wrap">
        <img class="catalog-cover" src="${game.image}" alt="${game.title}" loading="lazy">
        <span class="catalog-tag">${game.tag}</span>
      </div>
      <div class="catalog-card-body">
        <h2>${game.title}</h2>
        <p class="catalog-platform">${game.platform}</p>
        <div class="region-prices" aria-label="Цены по регионам">
          <div class="region-price ${game.prices.india === best ? 'is-best' : ''}">
            <span class="region-name">🇮🇳 Индия</span>
            <strong>${rub(game.prices.india)}</strong>
          </div>
          <div class="region-price ${game.prices.turkey === best ? 'is-best' : ''}">
            <span class="region-name">🇹🇷 Турция</span>
            <strong>${rub(game.prices.turkey)}</strong>
          </div>
        </div>
        <a class="button primary catalog-order" href="${TELEGRAM_URL}" target="_blank" rel="noopener" aria-label="Уточнить цену ${game.title}">Уточнить цену</a>
      </div>
    </article>`;
}

async function renderCatalog() {
  const catalog = document.getElementById('gamesCatalog');
  const updated = document.getElementById('catalogUpdated');
  try {
    const response = await fetch(`games.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('catalog unavailable');
    const data = await response.json();
    catalog.innerHTML = data.games.map(gameCard).join('');
    updated.textContent = `Обновлено ${data.updated}`;
    observeReveals();
  } catch {
    catalog.innerHTML = '<div class="catalog-loading">Каталог временно не загрузился. Напиши нам — быстро уточним цену.</div>';
    updated.textContent = 'Актуальную цену уточним в Telegram';
  }
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.animate([
      { opacity: 0, transform: 'translateY(14px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    observer.unobserve(entry.target);
  });
}, { threshold: .1 });

function observeReveals() {
  document.querySelectorAll('.reveal-card:not([data-observed])').forEach(element => {
    element.dataset.observed = 'true';
    element.style.opacity = '0';
    observer.observe(element);
  });
}

renderPlan();
observeReveals();
renderCatalog();
