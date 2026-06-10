const plans = {
  essential: {
    title: 'PS Plus Essential',
    note: 'Онлайн-мультиплеер, игры месяца и базовые возможности PS Plus.',
    features: ['онлайн', 'игры месяца', 'облако'],
    prices: { 1: 1490, 3: 3290, 12: 7490 }
  },
  extra: {
    title: 'PS Plus Extra',
    note: 'Каталог игр плюс все базовые преимущества PS Plus Essential.',
    features: ['каталог игр', 'онлайн', 'облако'],
    prices: { 1: 1890, 3: 4490, 12: 11990 }
  },
  deluxe: {
    title: 'PS Plus Deluxe',
    note: 'Максимальный уровень PS Plus: всё из Extra плюс триалы и классика.',
    features: ['классика', 'триалы', 'всё из Extra'],
    prices: { 1: 1990, 3: 4990, 12: 13490 }
  }
};

const rub = (n) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
let selectedPlan = 'essential';
let selectedMonths = '1';

function removeExpiredSale() {
  // Убираем завершённую распродажу Days of Play с главной до добавления новой акции.
  document.querySelectorAll('a[href="#days"]').forEach(link => {
    // Навигационную ссылку убираем, кнопку в hero переводим на новинки.
    if (link.classList.contains('button')) {
      link.href = '#releases';
      link.textContent = 'Смотреть новинки';
    } else {
      link.remove();
    }
  });

  const daysSection = document.getElementById('days');
  if (daysSection) {
    daysSection.remove();
  }

  // Убираем слайд Days of Play из правого hero-блока, чтобы распродажа не мелькала.
  document.querySelectorAll('#softSlider .soft-slide').forEach(slide => {
    const img = slide.querySelector('img');
    const alt = (img?.getAttribute('alt') || '').toLowerCase();
    const src = (img?.getAttribute('src') || '').toLowerCase();

    if (alt.includes('days of play') || src.includes('days')) {
      slide.remove();
    }
  });

  const firstSlide = document.querySelector('#softSlider .soft-slide');
  if (firstSlide) {
    firstSlide.classList.add('is-front');
  }
}

function updateMain() {
  const p = plans[selectedPlan];
  document.getElementById('selectedName').textContent = p.title;
  document.getElementById('selectedPrice').textContent = rub(p.prices[selectedMonths]);
  document.getElementById('selectedNote').textContent = p.note;
  document.getElementById('orderButton').textContent = 'Оформить ' + p.title.replace('PS Plus ', '');
  const row = document.getElementById('featureRow');
  row.innerHTML = p.features.map(x => `<span>${x}</span>`).join('');
  document.querySelectorAll('.plan-tile').forEach(btn => btn.classList.toggle('active', btn.dataset.plan === selectedPlan));
  document.querySelectorAll('.duration').forEach(btn => btn.classList.toggle('active', btn.dataset.months === selectedMonths));
}

removeExpiredSale();

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
