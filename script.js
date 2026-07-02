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
const GOTHIC_COVER = 'assets/new-gothic-1-remake.jpg.jpg';
const HALO_COVER = 'assets/new-halo-campaign-evolved.jpg.jpg';

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
