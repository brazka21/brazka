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
    .gta6-faq-section{margin-top:-2px}
    .gta6-faq-card{padding:clamp(24px,4vw,42px);border-radius:34px;background:radial-gradient(circle at top right,rgba(94,107,255,.18),transparent 34%),linear-gradient(180deg,rgba(12,18,38,.86),rgba(7,10,20,.92));border:1px solid rgba(255,255,255,.09);box-shadow:0 22px 70px rgba(0,0,0,.28)}
    .gta6-faq-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px}
    .gta6-faq-head h2{margin:0;font-size:clamp(32px,4vw,52px);line-height:.98;letter-spacing:-.055em}
    .gta6-faq-head p{margin:0;max-width:460px;color:rgba(255,255,255,.72);line-height:1.55;font-size:16px}
    .gta6-faq-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .gta6-faq-item{padding:18px;border-radius:24px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.085)}
    .gta6-faq-item h3{margin:0 0 8px;font-size:18px;letter-spacing:-.035em}
    .gta6-faq-item p{margin:0;color:rgba(255,255,255,.72);line-height:1.55;font-size:14px}
    .gta6-faq-cta{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:16px;padding:18px;border-radius:24px;background:linear-gradient(90deg,rgba(94,107,255,.18),rgba(34,184,255,.14));border:1px solid rgba(105,174,255,.20)}
    .gta6-faq-cta span{color:rgba(255,255,255,.78);font-weight:700}
    .gta6-faq-cta .button{min-height:48px}
    @media(max-width:760px){.gta6-faq-head{display:block}.gta6-faq-head p{margin-top:10px}.gta6-faq-grid{grid-template-columns:1fr}.gta6-faq-cta{flex-direction:column;align-items:flex-start}.gta6-faq-cta .button{width:100%}}
  `;
  document.head.appendChild(style);
}

function buildGtaFaq() {
  if (document.getElementById('gta6Faq')) return;
  const gtaSection = document.getElementById('gta6');
  if (!gtaSection) return;

  injectGtaFaqStyles();

  const faq = document.createElement('section');
  faq.className = 'section-block gta6-faq-section';
  faq.id = 'gta6Faq';
  faq.innerHTML = `
    <div class="gta6-faq-card reveal-card">
      <div class="gta6-faq-head">
        <h2>FAQ по GTA VI</h2>
        <p>Коротко и по делу: как оформить предзаказ, какой аккаунт нужен и что будет после оплаты.</p>
      </div>
      <div class="gta6-faq-grid">
        <article class="gta6-faq-item">
          <h3>На какой аккаунт можно оформить?</h3>
          <p>Работаем с аккаунтами подходящего региона. Если у тебя РФ-аккаунт или не знаешь регион — сначала проверим и подскажем, как лучше сделать.</p>
        </article>
        <article class="gta6-faq-item">
          <h3>Что нужно от меня?</h3>
          <p>Напиши в Telegram, какое издание хочешь: Standard или Ultimate. Дальше проверим регион, цену и объясним порядок оформления.</p>
        </article>
        <article class="gta6-faq-item">
          <h3>Когда игра появится?</h3>
          <p>После оформления предзаказ будет закреплён за аккаунтом. Когда игра станет доступна к загрузке/запуску, она появится в библиотеке по правилам PS Store.</p>
        </article>
        <article class="gta6-faq-item">
          <h3>Standard или Ultimate?</h3>
          <p>Standard — сама игра. Ultimate — игра плюс дополнительный контент из апгрейда. Если сомневаешься, напиши — подберём без переплаты.</p>
        </article>
        <article class="gta6-faq-item">
          <h3>Это безопасно?</h3>
          <p>Перед оформлением объясняем каждый шаг и не гоним в оплату, пока не понятно, подходит ли твой аккаунт и регион.</p>
        </article>
        <article class="gta6-faq-item">
          <h3>Сколько занимает оформление?</h3>
          <p>Обычно быстро, но зависит от региона аккаунта и способа оплаты. Лучше сразу написать — проверим и скажем по факту.</p>
        </article>
      </div>
      <div class="gta6-faq-cta">
        <span>Хочешь GTA VI без возни с регионами и оплатой?</span>
        <a class="button primary" href="${PERSONAL_TELEGRAM_URL}" target="_blank" rel="noopener">Написать лично</a>
      </div>
    </div>
  `;

  gtaSection.insertAdjacentElement('afterend', faq);
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
