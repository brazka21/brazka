function startCountdown(config) {
  const releaseDate = new Date(config.date).getTime();

  const daysEl = document.getElementById(config.days);
  const hoursEl = document.getElementById(config.hours);
  const minutesEl = document.getElementById(config.minutes);
  const secondsEl = document.getElementById(config.seconds);

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const pad = (n) => String(n).padStart(2, '0');

  function updateCountdown() {
    const now = Date.now();
    let diff = releaseDate - now;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 1000 * 60;
    const seconds = Math.floor(diff / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function startPromoSlider() {
  const slides = Array.from(document.querySelectorAll('.promo-slide'));
  const dots = Array.from(document.querySelectorAll('.promo-dot'));
  if (slides.length < 2) return;

  let active = 0;
  let timer = null;

  function show(index) {
    active = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
  }

  function next() {
    show((active + 1) % slides.length);
  }

  function restart() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 6500);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      show(index);
      restart();
    });
  });

  show(0);
  restart();
}

startCountdown({
  date: '2026-09-15T07:00:00+10:00',
  days: 'timerDays',
  hours: 'timerHours',
  minutes: 'timerMinutes',
  seconds: 'timerSeconds'
});

startCountdown({
  date: '2026-11-19T00:00:00+10:00',
  days: 'gtaDays',
  hours: 'gtaHours',
  minutes: 'gtaMinutes',
  seconds: 'gtaSeconds'
});

startPromoSlider();
