const plans = {
  essential: {
    title: 'PS Plus Essential',
    note: 'Онлайн-мультиплеер, игры месяца и базовые возможности PS Plus.',
    features: ['онлайн', 'игры месяца', 'облако'],
    prices: { 1: 1090, 3: 2990, 12: 6900 }
  },
  extra: {
    title: 'PS Plus Extra',
    note: 'Каталог игр плюс все базовые преимущества PS Plus Essential.',
    features: ['каталог игр', 'онлайн', 'облако'],
    prices: { 1: 1590, 3: 4290, 12: 10590 }
  },
  deluxe: {
    title: 'PS Plus Deluxe',
    note: 'Максимальный уровень PS Plus: всё из Extra плюс триалы и классика.',
    features: ['классика', 'триалы', 'всё из Extra'],
    prices: { 1: 1790, 3: 4790, 12: 12390 }
  }
};

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
let selectedPlan = 'essential';
let selectedMonths = '1';


function updateMain() {
  const p = plans[selectedPlan];
  document.getElementById('selectedName').textContent = p.title;
  document.getElementById('selectedPrice').textContent = rub(p.prices[selectedMonths]);
  document.getElementById('selectedNote').textContent = p.note;
  document.getElementById('orderButton').textContent = 'Уточнить цену и оформить';
  const row = document.getElementById('featureRow');
  row.innerHTML = p.features.map(x => `<span>${x}</span>`).join('');
  document.querySelectorAll('.plan-tile').forEach(btn => btn.classList.toggle('active', btn.dataset.plan === selectedPlan));
  document.querySelectorAll('.duration').forEach(btn => btn.classList.toggle('active', btn.dataset.months === selectedMonths));
}

document.querySelectorAll('.plan-tile').forEach(btn => {
  btn.addEventListener('click', () => { selectedPlan = btn.dataset.plan; updateMain(); });
});
document.querySelectorAll('.duration').forEach(btn => {
  btn.addEventListener('click', () => { selectedMonths = btn.dataset.months; updateMain(); });
});

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
