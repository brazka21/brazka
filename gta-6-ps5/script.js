
const releaseDate = new Date('2026-11-19T00:00:00+10:00').getTime();

function pad(n) {
  return String(n).padStart(2, '0');
}

function updateCountdown() {
  let diff = releaseDate - Date.now();
  if (diff < 0) diff = 0;

  const days = Math.floor(diff / 86400000);
  diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000);
  diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);

  document.getElementById('days').textContent = days;
  document.getElementById('hours').textContent = pad(hours);
  document.getElementById('minutes').textContent = pad(minutes);
  document.getElementById('seconds').textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);
