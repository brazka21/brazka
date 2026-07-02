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

const saleItems = [
  {
    title: 'REANIMAL',
    platform: 'PS5',
    oldPrice: 4025,
    price: 3220,
    discount: '−20%',
    image: 'assets/sale-reanimal.webp'
  },
  {
    title: 'ARC Raiders',
    platform: 'PS5',
    oldPrice: 4600,
    price: 3450,
    discount: '−25%',
    image: 'assets/sale-arc-raiders.jpg'
  },
  {
    title: 'Moving Out 2',
    platform: 'PS4 / PS5',
    oldPrice: 2600,
    price: 650,
    discount: '−75%',
    image: 'assets/sale-moving-out-2.jpg'
  },
  {
    title: 'HITMAN World of Assassination',
    platform: 'Deluxe Edition • PS4 / PS5',
    oldPrice: 7700,
    price: 3465,
    discount: '−55%',
    image: 'assets/sale-hitman-deluxe.jpg'
  },
  {
    title: 'Resident Evil 4',
    platform: 'Gold Edition • PS4 / PS5',
    oldPrice: 4020,
    price: 1290,
    discount: '−68%',
    image: 'assets/sale-re4-gold.jpg'
  }
];

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
    .gta6-inline-faq-head span{color:rgba(255,255,255,.64);font-size:14px;font-weight:700}
    .gta6-inline-faq-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .gta6-inline-faq-item{padding:14px;border-radius:20px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075)}
    .gta6-inline-faq-item strong{display:block;margin-bottom:6px;color:#fff;font-size:14px;line-height:1.2;letter-spacing:-.02em}
    .gta6-inline-faq-item p{margin:0;color:rgba(255,255,255,.68);font-size:13px;line-height:1.45}
    @media(max-width:980px){.gta6-inline-faq-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:760px){.gta6-inline-faq{margin:0 12px 12px;padding:16px;border-radius:22px}.gta6-inline-faq-head{display:block}.gta6-inline-faq-head span{display:block;margin-top:6px}.gta6-inline-faq-grid{grid-template-columns:1fr}.gta6-inline-faq-item{padding:13px}}
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
      <h3>Как оформить GTA VI?</h3>
      <span>коротко, без лишней воды</span>
    </div>
    <div class="gta6-inline-faq-grid">
      <div class="gta6-inline-faq-item">
        <strong>1. Пишешь мне</strong>
        <p>Standard или Ultimate — и какой регион аккаунта.</p>
      </div>
      <div class="gta6-inline-faq-item">
        <strong>2. Проверяем аккаунт</strong>
        <p>Если РФ или регион не подходит — скажу рабочий вариант.</p>
      </div>
      <div class="gta6-inline-faq-item">
        <strong>3. Оформляем</strong>
        <p>Покупка закрепляется за твоим аккаунтом в PS Store.</p>
      </div>
      <div class="gta6-inline-faq-item">
        <strong>4. Игра ждёт релиза</strong>
        <p>Когда откроют загрузку/запуск — появится в библиотеке.</p>
      </div>
    </div>
  `;

  gtaCard.appendChild(faq);
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
  const minutes = Math.floor(promoSecondsLeft / 30);
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
