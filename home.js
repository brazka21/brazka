'use strict';
(() => {
  const dock=document.getElementById('homePlusDock'),plus=document.getElementById('plus'),hero=document.querySelector('.home-hero');
  let plusVisible=false;
  const update=()=>{dock.hidden=plusVisible||window.scrollY<hero.offsetHeight/2||!document.getElementById('detailView').hidden||!document.getElementById('cartModal').hidden;};
  new IntersectionObserver(entries=>{plusVisible=entries[0].isIntersecting;update();},{threshold:0}).observe(plus);
  window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);
  new MutationObserver(update).observe(document.getElementById('cartModal'),{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(update).observe(document.getElementById('detailView'),{attributes:true,attributeFilter:['hidden']});
  fetch('/games.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
    const games=normalizeCatalog(data);
    document.querySelectorAll('[data-home-game]').forEach(card=>{const game=games.find(g=>g.id===card.dataset.homeGame);if(game){const p=minPrice(game,'turkey');card.querySelector('[data-home-price]').textContent=p?'от '+money(p):'Уточнить цену';}});
  }).catch(()=>{document.querySelectorAll('[data-home-price]').forEach(p=>p.textContent='Уточнить цену');});
  document.querySelectorAll('.home-page img').forEach(img=>img.addEventListener('error',()=>{if(!img.dataset.homeFallback){img.dataset.homeFallback='1';img.src='/assets/og-image-v2.jpg';}}));
})();
