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
    note: 'Максимальный уровень PS Plus: всё из Extra плюс триалы и классика.',
    features: ['классика', 'триалы', 'всё из Extra'],
    prices: { 1: 1790, 3: 4790, 12: 13990 }
  }
};

const PERSONAL_TELEGRAM_URL = 'https://t.me/razim954';
const PERSONAL_TELEGRAM_LABEL = 'Написать в Telegram';

const GOTHIC_COVER = 'data:image/webp;base64,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';
const HALO_COVER = 'data:image/webp;base64,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';

const rub = (n) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
const PROMO_DISCOUNT_RATE = 0;
let promoDiscountActive = false;
const promoDiscountPrice = (n) => Math.round((n * (1 - PROMO_DISCOUNT_RATE)) / 10) * 10;
const priceNumberFromText = (text) => {
  const digits = String(text).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
};
const priceWithDiscountHtml = (original) => `<span class="promo-discount-old">${rub(original)}</span><span class="promo-discount-new">${rub(promoDiscountPrice(original))}</span>`;
let selectedPlan = 'essential';
let selectedMonths = '1';

function routeButtonsToPersonalTelegram() {
  document.querySelectorAll('a[href="#days"]').forEach((link) => link.remove());

  document.querySelectorAll('a[href*="t.me/brazkainfo_bot"], a[href*="t.me/brazkashop"], a[href*="telegram.me/brazkainfo_bot"]').forEach((link) => {
    link.href = PERSONAL_TELEGRAM_URL;
    link.target = '_blank';
    link.rel = 'noopener';
  });

  document.querySelectorAll('.button.primary, .nav-cta, .messenger-button').forEach((button) => {
    if (button.href && button.href.includes('t.me/razim954') && /бот|оформить|написать|уточнить|задать/i.test(button.textContent)) {
      button.setAttribute('aria-label', PERSONAL_TELEGRAM_LABEL);
    }
  });
}

function injectGtaFaqStyles() {
  if (document.getElementById('gta-faq-styles')) return;
  const style = document.createElement('style');
  style.id = 'gta-faq-styles';
  style.textContent = `
    .gta6-inline-faq{position:relative;z-index:3;margin:0 clamp(16px,3vw,34px) clamp(16px,3vw,34px);padding:clamp(16px,2.4vw,26px);border-radius:28px;background:linear-gradient(180deg,rgba(8,12,28,.78),rgba(5,8,18,.86));border:1px solid rgba(255,255,255,.10);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 18px 52px rgba(0,0,0,.24);backdrop-filter:blur(10px)}
    .gta6-inline-faq-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px}
    .gta6-inline-faq-head h3{margin:0;font-size:clamp(22px,2.8vw,34px);line-height:1;letter-spacing:-.05em}
    .gta6-inline-faq-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .gta6-inline-faq-item{padding:14px;border-radius:20px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075)}
    .gta6-inline-faq-item strong{display:block;margin-bottom:6px;color:#fff;font-size:14px;line-height:1.2;letter-spacing:-.02em}
    .gta6-inline-faq-item p{margin:0;color:rgba(255,255,255,.68);font-size:13px;line-height:1.45}
    @media(max-width:980px){.gta6-inline-faq-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:760px){.gta6-inline-faq{margin:0 12px 12px;padding:16px;border-radius:22px}.gta6-inline-faq-head{display:block}.gta6-inline-faq-grid{grid-template-columns:1fr}.gta6-inline-faq-item{padding:13px}}
  `;
  document.head.appendChild(style);
}

function buildGtaFaq() {
  if (document.getElementById('gta6Faq')) return;
  const gtaCard = document.querySelector('#gta6 .gta6-order-card');
  if (!gtaCard) return;

  injectGtaFaqStyles();

  const faq = document.createElement('div');
  faq.className = 'gta6-inline-faq reveal-card';
  faq.id = 'gta6Faq';
  faq.innerHTML = `
    <div class="gta6-inline-faq-head">
      <h3>Как оформить предзаказ GTA VI</h3>
    </div>
    <div class="gta6-inline-faq-grid">
      <div class="gta6-inline-faq-item">
        <strong>1. Напишите нам</strong>
        <p>Укажите издание: Standard или Ultimate, а также регион вашего аккаунта.</p>
      </div>
      <div class="gta6-inline-faq-item">
        <strong>2. Проверим аккаунт</strong>
        <p>Подскажем, подходит ли регион, и предложим оптимальный вариант оформления.</p>
      </div>
      <div class="gta6-inline-faq-item">
        <strong>3. Оформим покупку</strong>
        <p>Предзаказ закрепляется за вашим аккаунтом в PlayStation Store.</p>
      </div>
      <div class="gta6-inline-faq-item">
        <strong>4. Ожидаете релиз</strong>
        <p>После открытия загрузки игра появится в вашей библиотеке.</p>
      </div>
    </div>
  `;

  gtaCard.appendChild(faq);
}

function injectReleaseStyles() {
  if (document.getElementById('brazka-releases-current-css')) return;
  const style = document.createElement('style');
  style.id = 'brazka-releases-current-css';
  style.textContent = `
    .release-card-cta{margin-top:14px;width:100%}
    .release-turkey-price{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.12)}
    .release-turkey-price span{color:rgba(255,255,255,.72);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}
    .release-turkey-price strong{font-size:28px!important;color:#fff;white-space:nowrap}
    .releases-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
    .releases-grid .catalog-card{min-height:430px}
    .releases-grid .catalog-card img{height:100%;object-fit:cover}
    @media(max-width:1180px){.releases-grid{display:flex!important;overflow-x:auto;gap:14px!important;padding-bottom:8px;scroll-snap-type:x proximity}.releases-grid .catalog-card{flex:0 0 245px;scroll-snap-align:start}}
    @media(max-width:760px){.releases-grid .catalog-card{flex-basis:235px;min-height:410px}.release-turkey-price strong{font-size:24px!important}}
  `;
  document.head.appendChild(style);
}

function updateReleasesBlock() {
  const grid = document.querySelector('#releases .releases-grid');
  if (!grid) return;
  injectReleaseStyles();

  const items = [
    { tag: 'предзаказ', title: 'GTA VI', platform: 'PS5 • Турция', image: 'assets/gta6-cover-art-main.jpg', price: 'от 9 100 ₽' },
    { tag: 'предзаказ', title: 'Marvel’s Wolverine', platform: 'PS5 • Турция', image: 'assets/wolverine-poster.jpg', price: '7 900 ₽' },
    { tag: 'предзаказ', title: 'Halo: Campaign Evolved', platform: 'PS5 • Турция', image: HALO_COVER, price: '5 999 ₽' },
    { tag: 'новинка', title: 'EA SPORTS UFC 6', platform: 'PS5 • Турция', image: 'assets/new-ufc-6-standard.jpg', price: '8 700 ₽' },
    { tag: 'новинка', title: 'Gothic 1 Remake', platform: 'PS5 • Турция', image: GOTHIC_COVER, price: '6 200 ₽' }
  ];

  grid.innerHTML = items.map((item) => `
    <article class="game-card catalog-card">
      <img src="${item.image}" alt="${item.title}">
      <div class="game-info">
        <span class="sale-tag">${item.tag}</span>
        <h3>${item.title}</h3>
        <p>${item.platform}</p>
        <div class="release-turkey-price"><span>Турция</span><strong>${item.price}</strong></div>
        <a class="button primary release-card-cta" href="${PERSONAL_TELEGRAM_URL}" target="_blank" rel="noopener">Оставить заявку</a>
      </div>
    </article>
  `).join('');
}

function updateMain() {
  const p = plans[selectedPlan];
  document.getElementById('selectedName').textContent = p.title;
  const selectedPriceEl = document.getElementById('selectedPrice');
  const selectedOriginalPrice = p.prices[selectedMonths];
  selectedPriceEl.innerHTML = promoDiscountActive ? priceWithDiscountHtml(selectedOriginalPrice) : rub(selectedOriginalPrice);
  document.getElementById('selectedNote').textContent = p.note;
  document.getElementById('orderButton').textContent = 'Уточнить цену и оформить';
  const row = document.getElementById('featureRow');
  row.innerHTML = p.features.map(x => `<span>${x}</span>`).join('');
  document.querySelectorAll('.plan-tile').forEach(btn => btn.classList.toggle('active', btn.dataset.plan === selectedPlan));
  document.querySelectorAll('.duration').forEach(btn => btn.classList.toggle('active', btn.dataset.months === selectedMonths));
}

document.querySelectorAll('.plan-tile').forEach(btn => {
  btn.addEventListener('click', () => { selectedPlan = btn.dataset.plan; updateMain(); routeButtonsToPersonalTelegram(); });
});
document.querySelectorAll('.duration').forEach(btn => {
  btn.addEventListener('click', () => { selectedMonths = btn.dataset.months; updateMain(); routeButtonsToPersonalTelegram(); });
});

function updateStaticDiscountPrices() {
  return;
}

buildGtaFaq();
updateReleasesBlock();
routeButtonsToPersonalTelegram();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.animate([
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section-block, .reveal-card, .game-card, .plan-tile').forEach(el => {
  el.style.opacity = '0';
  observer.observe(el);
});

const slides = Array.from(document.querySelectorAll('#softSlider .soft-slide'));
let activeIndex = 0;
function updateDeck() {
  slides.forEach((slide, index) => slide.classList.toggle('is-front', index === activeIndex));
}
if (slides.length) {
  updateDeck();
  if (slides.length > 1) {
    setInterval(() => {
      activeIndex = (activeIndex + 1) % slides.length;
      updateDeck();
    }, 3200);
  }
}

updateMain();
updateReleasesBlock();
routeButtonsToPersonalTelegram();

const promoMessage = 'Хочу воспользоваться промокодом BRAZKA5 на скидку 5%';
const activatePromoButton = document.getElementById('activatePromoButton');
const promoCodeResult = document.getElementById('promoCodeResult');
const promoTimer = document.getElementById('promoTimer');
const copyPromoButton = document.getElementById('copyPromoButton');

let promoInterval = null;
let promoSecondsLeft = 30 * 60;

function copyPromoMessage() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(promoMessage).catch(() => {});
  }
}

function renderPromoTimer() {
  if (!promoTimer) return;
  const minutes = Math.floor(promoSecondsLeft / 60);
  const seconds = promoSecondsLeft % 60;
  promoTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startPromoTimer() {
  promoSecondsLeft = 30 * 60;
  renderPromoTimer();
  clearInterval(promoInterval);
  promoInterval = setInterval(() => {
    promoSecondsLeft -= 1;
    if (promoSecondsLeft <= 0) {
      clearInterval(promoInterval);
      promoSecondsLeft = 0;
      renderPromoTimer();
      return;
    }
    renderPromoTimer();
  }, 1000);
}

if (activatePromoButton && promoCodeResult) {
  activatePromoButton.addEventListener('click', () => {
    promoDiscountActive = true;
    promoCodeResult.classList.add('is-active');
    activatePromoButton.textContent = 'Скидка активирована';
    updateMain();
    routeButtonsToPersonalTelegram();
    updateStaticDiscountPrices();
    copyPromoMessage();
    startPromoTimer();
  });
}

if (copyPromoButton) {
  copyPromoButton.addEventListener('click', () => {
    copyPromoMessage();
    copyPromoButton.textContent = 'Скопировано';
    setTimeout(() => copyPromoButton.textContent = 'Скопировать ещё раз', 1600);
  });
}
