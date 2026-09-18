'use strict';
// Yandex.Metrika — BRAZKA
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (let j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
  k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=112697107','ym');
ym(112697107,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});

const CONTACT_URL = 'https://t.me/m/LyEKjl0bODFi';
const REGIONS = ['india', 'turkey'];
const REGION_LABELS = {india:'🇮🇳 Индия',turkey:'🇹🇷 Турция'};
const money = value => Number.isFinite(value) && value > 0 ? new Intl.NumberFormat('ru-RU').format(value) + ' ₽' : 'Уточнить';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanSearch = value => String(value).toLowerCase().replace(/[™®’'`]/g,'').replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,' ').trim();
function activeDiscount(edition, region, now=Date.now()) {
  if(edition.availability?.[region]==='unavailable')return null;
  const sale = edition.discounts?.[region];
  return sale && sale.percent > 0 && Date.parse(sale.endsAt) > now ? sale : null;
}
function currentPrice(edition, region, now=Date.now()) {
  if(edition.availability?.[region]==='unavailable')return null;
  const sale=edition.discounts?.[region];
  if(sale?.endsAt && Date.parse(sale.endsAt)<=now) return null;
  const price=edition.prices?.[region];
  return Number.isFinite(price)&&price>0 ? price : null;
}
function minPrice(game,region) { const values=game.editions.map(e=>currentPrice(e,region)).filter(Number.isFinite);return values.length?Math.min(...values):null; }
function lowestPrice(game) {const p=REGIONS.map(r=>minPrice(game,r)).filter(Number.isFinite);return p.length?Math.min(...p):Infinity;}
function maxDiscount(game) {return Math.max(0,...game.editions.flatMap(e=>REGIONS.map(r=>activeDiscount(e,r)?.percent||0)));}
function normalizeCatalog(data) {
  const byId=new Map();
  for(const group of data.groups||[])for(const edition of group.games||[]){
    const id=edition.gameId;
    if(!id)continue;
    if(!byId.has(id)){const meta=data.titles?.[id]||{};byId.set(id,{...meta,id,title:meta.title||edition.title,editions:[]});}
    byId.get(id).editions.push(edition);
  }
  return [...byId.values()].map(game=>({...game,image:game.image||game.editions[0].image,editions:game.editions.sort((a,b)=>(a.editionOrder??10)-(b.editionOrder??10)),search:cleanSearch([game.title,...(game.aliases||[]),...game.editions.map(e=>e.edition)].join(' '))}));
}
function filterGames(games,{query='',filter='all',sort='featured'}={}){
  const words=cleanSearch(query).split(' ').filter(Boolean);
  // A named game search always covers the entire catalogue, including sale items.
  const matches=games.filter(g=>words.every(w=>g.search.includes(w))&&(words.length||filter==='all'||g.multiplayer?.[filter]||(filter==='sale'&&maxDiscount(g)>0)||(filter==='premium'&&g.editions.some(e=>/deluxe|ultimate|premium|vault|gold|eclipse|ultra/i.test(e.edition)))||(filter==='preorder'&&Date.parse(g.releaseDate)>Date.now())));
  return matches.sort((a,b)=>sort==='price-asc'?lowestPrice(a)-lowestPrice(b):sort==='price-desc'?lowestPrice(b)-lowestPrice(a):sort==='title'?a.title.localeCompare(b.title,'ru'):(a.priority??99)-(b.priority??99));
}
function gameUrl(game,edition){return '/games/'+game.id+'/'+(edition?'?edition='+encodeURIComponent(edition.editionId):'');}
const collectionModes={'na-odnoy-ps5':'local','split-screen':'split','po-seti':'online'};
const collectionTitles={local:'Игры на двоих на одной PS5',split:'Игры со сплит-скрином на PS5',online:'Игры на двоих по сети на PS5'};
if(typeof module!=='undefined'&&module.exports)module.exports={normalizeCatalog,filterGames,activeDiscount,currentPrice,minPrice,money,cleanSearch};
if(typeof document!=='undefined'){
  let games=[],catalogData,query='',filter='all',sort='featured',selectedGame,selectedEdition,selectedRegion='india',selectedPoints,selectedPointsRegion='india',catalogScroll=0;
  const $=id=>document.getElementById(id);
  const rootTitle='БРАЗКА — каталог игр PlayStation, цены Индии и Турции';
  const planData={essential:{name:'Essential',note:'Онлайн, игры месяца и облачные сохранения.',prices:{1:1090,3:2990,12:7900}},extra:{name:'Extra',note:'Каталог игр и все возможности Essential.',prices:{1:1590,3:4290,12:11990}},deluxe:{name:'Deluxe',note:'Классика, пробные версии и все возможности Extra.',prices:{1:1790,3:4790,12:13990}}};
  let plan='essential',months=1;
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,5000);}
  function tile(game){
    const sale=maxDiscount(game),ind=minPrice(game,'india'),tr=minPrice(game,'turkey'),best=Math.min(ind??Infinity,tr??Infinity);
    return `<a class="game-tile" href="${gameUrl(game)}" data-game="${escapeHtml(game.id)}" aria-label="${escapeHtml(game.title)} — выбрать издание"><div class="cover-wrap"><img src="${escapeHtml(game.image)}" alt="${escapeHtml(game.title)}" loading="lazy" decoding="async" width="400" height="400"><div class="tile-badges">${sale?`<span class="sale-badge">−${sale}% PS Store</span>`:''}<span class="edition-count">${game.editions.length} изд.</span></div></div><p class="tile-platform">${escapeHtml(game.platform||'PS5')}${Date.parse(game.releaseDate)>Date.now()?' · ПРЕДЗАКАЗ':''}</p><h3 class="tile-title">${escapeHtml(game.title)}</h3>${game.multiplayer?`<p class="coop-tile-label">${escapeHtml(game.multiplayer.label)}</p>`:''}<div class="tile-regions">${REGIONS.map(r=>{const p=r==='india'?ind:tr;return `<div class="tile-region ${p===best?'best':''}"><span>${REGION_LABELS[r]}</span><strong class="${sale?'sale-pulse':''}">${p&&game.editions.length>1?'<small>от</small>':''}${money(p)}</strong></div>`}).join('')}</div></a>`;
  }
  function renderGrid(){
    const matches=filterGames(games,{query,filter,sort});$('gameGrid').innerHTML=matches.map(tile).join('');$('gameGrid').hidden=!matches.length;$('emptyState').hidden=!!matches.length;
    $('catalogCount').textContent=query?`${matches.length} из ${games.length}`:`${matches.length} игр`;
    $('saleCount').textContent=games.filter(g=>maxDiscount(g)>0).length;
    $('searchContext').hidden=!(query&&filter!=='all');$('searchContext').textContent='Поиск по всем играм, включая скидки и предзаказы';
    document.querySelectorAll('[data-filter]').forEach(b=>{const active=!query&&b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  function renderFeature(){
    if(!$('featureBanner'))return;
    const gta=games.find(g=>g.id==='gta-vi');if(!gta)return;
    const ultimate=gta.editions.find(e=>/ultimate/i.test(e.edition))||gta.editions[0];
    const price=Math.min(...REGIONS.map(r=>currentPrice(ultimate,r)??Infinity));
    $('featureBanner').innerHTML=`<img class="feature-art" src="/assets/gta6-jason-lucia-main.jpg" alt="Джейсон и Люсия — Grand Theft Auto VI" width="1400" height="500" fetchpriority="high"><div class="feature-copy"><p class="eyebrow">В ЦЕНТРЕ ВНИМАНИЯ · ПРЕДЗАКАЗ</p><h2>Grand Theft Auto VI</h2><p>${escapeHtml(ultimate.edition)} · ${escapeHtml(gta.release||'19 ноября')}</p><div class="feature-bottom"><span class="feature-price"><small>от</small> ${money(price)}</span><a class="button primary" href="${gameUrl(gta,ultimate)}" data-game="${gta.id}" data-edition="${ultimate.editionId}">Выбрать издание ↗</a></div></div>`;
    const picks=[{game:gta,edition:ultimate},...games.filter(g=>maxDiscount(g)>0).sort((a,b)=>maxDiscount(b)-maxDiscount(a)).slice(0,5).map(game=>({game,edition:game.editions.filter(e=>REGIONS.some(r=>activeDiscount(e,r))).sort((a,b)=>Math.min(...REGIONS.map(r=>currentPrice(a,r)??Infinity))-Math.min(...REGIONS.map(r=>currentPrice(b,r)??Infinity)))[0]}))];
    const seg=picks.map(({game,edition})=>{const p=Math.min(...REGIONS.map(r=>currentPrice(edition,r)??Infinity));return `<a class="ticker-offer" href="${gameUrl(game,edition)}" data-game="${game.id}" data-edition="${edition.editionId}"><span>${escapeHtml(game.title)} · ${escapeHtml(edition.edition)}</span><b>${money(p)}</b></a>`}).join('');
    $('tickerTrack').innerHTML=`<div class="ticker-segment">${seg}</div><div class="ticker-segment" aria-hidden="true">${seg.replaceAll('<a ','<a tabindex="-1" ')}</div>`;$('offersStrip').hidden=false;
  }
  function detailShell(game){
    $('detailView').innerHTML=`<a class="back-link" href="/" data-back>← Все игры</a><div class="detail-hero"><img id="detailCover" class="detail-cover" src="${escapeHtml(selectedEdition.image||game.image)}" alt="${escapeHtml(game.title)} — ${escapeHtml(selectedEdition.edition)}" width="400" height="400"><div class="detail-info"><p class="eyebrow">PLAYSTATION · ВЫБЕРИ СВОЁ ИЗДАНИЕ</p><h1 tabindex="-1">${escapeHtml(game.title)}</h1><p class="detail-description">${escapeHtml(game.description||'Сравни издания и выбери регион своего аккаунта.')}</p>${game.multiplayer?`<section class="coop-info"><h2>Как играть вместе</h2><p>${escapeHtml(game.multiplayer.label)}</p><p>${escapeHtml(game.multiplayer.note)}</p></section>`:''}<div class="detail-meta"><span>${escapeHtml(game.platform||'PS5')}</span><span>${escapeHtml(game.release||'Уже в продаже')}</span><span>Изданий: ${game.editions.length}</span></div><p class="detail-intro-prices">от ${money(lowestPrice(game))}</p></div><p class="detail-description">${escapeHtml(game.description||'Сравни издания и выбери регион своего аккаунта.')}</p></div><div class="editions-heading"><h2>Выбери издание</h2><span class="muted">Полные версии игры</span></div><div class="edition-layout"><div class="edition-list" id="editionList" role="group" aria-label="Издания игры"></div><aside class="purchase-panel" id="purchasePanel" aria-label="Выбранное издание и заказ"></aside></div>${game.fcPoints?`<section class="points-section" id="fcPoints"><div class="points-heading"><div><p class="eyebrow">ULTIMATE TEAM</p><h2>${escapeHtml(game.fcPoints.title)}</h2><p>${escapeHtml(game.fcPoints.note)}</p></div><span class="points-badge">Только для FC 27</span></div><div id="pointsContent"></div></section>`:''}<section class="related-section"><div class="section-heading"><h2>Ещё в каталоге</h2></div><div class="game-grid">${games.filter(g=>g.id!==game.id).sort((a,b)=>(a.priority??99)-(b.priority??99)).slice(0,6).map(tile).join('')}</div></section>`;
    renderEdition();
    if(game.fcPoints){selectedPoints=game.fcPoints.packs.find(p=>p.id==='500')||game.fcPoints.packs[0];selectedPointsRegion='india';renderPoints();}
  }
  function renderEdition(){
    const game=selectedGame,edition=selectedEdition;
    const cover=$('detailCover');cover.src=edition.image||game.image;cover.alt=`${game.title} — ${edition.edition}`;
    $('editionList').innerHTML=game.editions.map(e=>{const p=Math.min(...REGIONS.map(r=>currentPrice(e,r)??Infinity)),discount=Math.max(...REGIONS.map(r=>activeDiscount(e,r)?.percent||0));return `<button class="edition-choice ${e.editionId===edition.editionId?'selected':''}" data-select-edition="${escapeHtml(e.editionId)}" aria-pressed="${e.editionId===edition.editionId}"><img class="edition-thumb" src="${escapeHtml(e.image||game.image)}" alt="" width="68" height="68" loading="lazy"><span><span class="edition-name">${escapeHtml(e.edition)}</span><span class="edition-summary">${escapeHtml(e.summary||'Полная игра')}</span></span><span class="edition-from">${Number.isFinite(p)?`<small>от</small>${money(p)}`:`<span class="edition-stock">${escapeHtml(e.availabilityLabel||'Уточнить цену')}</span>`}${discount?`<span class="sale-badge">−${discount}% в PS Store</span>`:''}</span></button>`}).join('');
    renderPurchase();
  }
  function renderPurchase(){
    const game=selectedGame,e=selectedEdition;
    const sale=activeDiscount(e,selectedRegion),price=currentPrice(e,selectedRegion),unavailable=e.availability?.[selectedRegion]==='unavailable';
    $('purchasePanel').innerHTML=`<p class="purchase-kicker">${escapeHtml(game.title)}</p><h3>${escapeHtml(e.edition)}</h3><div class="region-options" role="group" aria-label="Регион аккаунта">${REGIONS.map(r=>{const p=currentPrice(e,r),discount=activeDiscount(e,r),old=e.oldPrices?.[r];return `<button class="region-option ${r===selectedRegion?'selected':''}" data-region="${r}" aria-pressed="${r===selectedRegion}"><span class="region-label">${REGION_LABELS[r]}</span><strong class="${e.availability?.[r]==='unavailable'?'unavailable-price':''}">${e.availability?.[r]==='unavailable'?'Недоступно':money(p)}</strong>${discount&&old>p?`<del>${money(old)}</del>`:''}${discount?`<span class="sale-badge">−${discount.percent}% в PS Store</span>`:''}</button>`}).join('')}</div>${sale?`<p class="sale-timing">Скидка в PS Store до ${new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(sale.endsAt))}</p>`:''}${unavailable?`<p class="availability-note">${escapeHtml(e.availabilityLabel||'Сейчас недоступно')}</p>`:''}<a class="button primary order-cta" href="${CONTACT_URL}" target="_blank" rel="noopener" id="gameOrder">${price?'Заказать за '+money(price):unavailable?'Уточнить варианты в Telegram':'Уточнить цену в Telegram'} ↗</a><p class="order-context">${REGION_LABELS[selectedRegion]} · ${escapeHtml(e.edition)}<br>Детали заказа скопируем для отправки в чат.</p><div class="edition-includes"><h4>Что входит</h4><ul>${(e.features?.length?e.features:['Полная версия игры']).map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul></div>${e.notice?`<p class="edition-notice">${escapeHtml(e.notice)}</p>`:''}<button class="order-copy" id="copyOrder">Скопировать заказ</button>`;
  }
  function renderPoints(){
    const section=$('pointsContent'),points=selectedGame.fcPoints;
    if(!section||!points||!selectedPoints)return;
    section.innerHTML=`<div class="points-layout"><div class="points-grid" role="group" aria-label="Номиналы FC Points">${points.packs.map(p=>`<button class="point-choice ${p.id===selectedPoints.id?'selected':''}" data-select-points="${escapeHtml(p.id)}" aria-pressed="${p.id===selectedPoints.id}"><strong>${escapeHtml(p.label)}</strong><span><i>🇮🇳 Индия</i><b>${money(p.prices.india)}</b></span><span><i>🇹🇷 Турция</i><b>${money(p.prices.turkey)}</b></span></button>`).join('')}</div><aside class="points-panel"><p class="purchase-kicker">EA SPORTS FC 27</p><h3>${escapeHtml(selectedPoints.label)}</h3><div class="region-options" role="group" aria-label="Регион аккаунта для FC Points">${REGIONS.map(r=>`<button class="region-option ${r===selectedPointsRegion?'selected':''}" data-points-region="${r}" aria-pressed="${r===selectedPointsRegion}"><span class="region-label">${REGION_LABELS[r]}</span><strong>${money(selectedPoints.prices[r])}</strong></button>`).join('')}</div><a class="button primary order-cta" href="${CONTACT_URL}" target="_blank" rel="noopener" id="pointsOrder">Заказать за ${money(selectedPoints.prices[selectedPointsRegion])} ↗</a><p class="order-context">${REGION_LABELS[selectedPointsRegion]} · ${escapeHtml(selectedPoints.label)}<br>Выбранный номинал скопируем для отправки в чат.</p><button class="order-copy" id="copyPointsOrder">Скопировать заказ</button></aside></div>`;
  }
  function orderText(){return `Привет! Хочу заказать ${selectedGame.title}, ${selectedEdition.edition}. Регион: ${selectedRegion==='india'?'Индия':'Турция'}. Цена на сайте: ${money(currentPrice(selectedEdition,selectedRegion))}. ${location.origin}${gameUrl(selectedGame,selectedEdition)}`;}
  function pointsOrderText(){return `Привет! Хочу заказать ${selectedPoints.label} для EA SPORTS FC 27. Регион аккаунта: ${selectedPointsRegion==='india'?'Индия':'Турция'}. Цена на сайте: ${money(selectedPoints.prices[selectedPointsRegion])}. ${location.origin}${gameUrl(selectedGame)}#fcPoints`;}
  function selectRoute({scroll=true}={}){
    const params=new URLSearchParams(location.search),pathGame=location.pathname.match(/^\/games\/([^/]+)\/?$/),id=pathGame?.[1]||params.get('game');
    const collection=location.pathname.match(/^\/collections\/([^/]+)\/?$/);
    if(!id){filter=collectionModes[collection?.[1]]||'all';renderGrid();$('catalogHeading').textContent=collectionTitles[filter]||'Каталог игр';}
    const canonical='https://brazka.shop'+(id?'/games/'+encodeURIComponent(id)+'/':collection?location.pathname:'/');
    document.querySelector('link[rel=canonical]').href=canonical;document.querySelector('meta[property="og:url"]').content=canonical;
    const game=games.find(g=>g.id===id);
    if(!id){$('storeView').hidden=false;$('detailView').hidden=true;document.title=collectionTitles[filter]?collectionTitles[filter]+' | БРАЗКА':rootTitle;selectedGame=null;if(scroll)requestAnimationFrame(()=>window.scrollTo(0,catalogScroll));return;}
    $('storeView').hidden=true;$('detailView').hidden=false;
    if(!game){$('detailView').innerHTML='<a class="back-link" href="/" data-back>← Все игры</a><div class="empty-state"><h1>Игра не найдена</h1><p>Вернись в каталог или напиши нам — найдём нужное издание.</p><a class="button primary" href="'+CONTACT_URL+'" target="_blank" rel="noopener">Написать ↗</a></div>';return;}
    selectedGame=game;
    const match=game.editions.find(e=>e.editionId===params.get('edition'));
    selectedEdition=match||game.editions.filter(e=>REGIONS.some(r=>currentPrice(e,r))).sort((a,b)=>Math.min(...REGIONS.map(r=>currentPrice(a,r)??Infinity))-Math.min(...REGIONS.map(r=>currentPrice(b,r)??Infinity)))[0]||game.editions[0];
    selectedRegion=REGIONS.reduce((a,b)=>(currentPrice(selectedEdition,a)??Infinity)<=(currentPrice(selectedEdition,b)??Infinity)?a:b);
    document.title=`${game.title} — издания и цены | БРАЗКА`;detailShell(game);if(scroll)window.scrollTo(0,0);
  }
  function navigateGame(id,edition){if(!$('storeView').hidden)catalogScroll=window.scrollY;const g=games.find(g=>g.id===id);if(!g)return;history.pushState({game:id},'',gameUrl(g,g.editions.find(e=>e.editionId===edition)));selectRoute();$('detailView').querySelector('h1')?.focus({preventScroll:true});}
  document.addEventListener('click',event=>{
    const gameLink=event.target.closest('[data-game]');
    if(gameLink&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();navigateGame(gameLink.dataset.game,gameLink.dataset.edition);return;}
    const back=event.target.closest('[data-back]');if(back){event.preventDefault();history.pushState({},'','/');selectRoute();return;}
    const choice=event.target.closest('[data-select-edition]');if(choice){selectedEdition=selectedGame.editions.find(e=>e.editionId===choice.dataset.selectEdition);history.replaceState({game:selectedGame.id},'',gameUrl(selectedGame,selectedEdition));renderEdition();$('editionList').querySelector(`[data-select-edition="${selectedEdition.editionId}"]`)?.focus({preventScroll:true});return;}
    const pointChoice=event.target.closest('[data-select-points]');if(pointChoice){selectedPoints=selectedGame.fcPoints.packs.find(p=>p.id===pointChoice.dataset.selectPoints);renderPoints();$('pointsContent').querySelector(`[data-select-points="${selectedPoints.id}"]`)?.focus({preventScroll:true});return;}
    const region=event.target.closest('[data-region]');if(region){selectedRegion=region.dataset.region;renderPurchase();$('purchasePanel').querySelector(`[data-region="${selectedRegion}"]`)?.focus({preventScroll:true});return;}
    const pointsRegion=event.target.closest('[data-points-region]');if(pointsRegion){selectedPointsRegion=pointsRegion.dataset.pointsRegion;renderPoints();$('pointsContent').querySelector(`[data-points-region="${selectedPointsRegion}"]`)?.focus({preventScroll:true});return;}
    if(event.target.closest('#copyOrder')){if(!navigator.clipboard){toast('Копирование недоступно. Напиши название игры и издание в чате.');return;}navigator.clipboard.writeText(orderText()).then(()=>toast('Заказ скопирован')).catch(()=>toast('Не удалось скопировать — выбери название игры и издание в чате.'));return;}
    if(event.target.closest('#copyPointsOrder')){if(!navigator.clipboard){toast('Копирование недоступно. Напиши номинал и регион в чате.');return;}navigator.clipboard.writeText(pointsOrderText()).then(()=>toast('Заказ скопирован')).catch(()=>toast('Не удалось скопировать — напиши номинал и регион в чате.'));return;}
    if(event.target.closest('#gameOrder')){if(typeof ym==='function')ym(112697107,'reachGoal','game_order_click');navigator.clipboard?.writeText(orderText()).catch(()=>{});return;}
    if(event.target.closest('#pointsOrder')){if(typeof ym==='function')ym(112697107,'reachGoal','fc_points_order_click');navigator.clipboard?.writeText(pointsOrderText()).catch(()=>{});return;}
  });
  $('gameSearch').addEventListener('input',e=>{query=e.target.value;renderGrid();});
  $('gameSort').addEventListener('change',e=>{sort=e.target.value;renderGrid();});
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{query='';$('gameSearch').value='';filter=b.dataset.filter;history.pushState({},'','/#catalog');$('catalogHeading').textContent='Каталог игр';$('collectionDescription')?.remove();document.querySelector('link[rel=canonical]').href='https://brazka.shop/';document.title=rootTitle;renderGrid();}));
  $('resetSearch').addEventListener('click',()=>{query='';filter='all';history.pushState({},'','/#catalog');$('catalogHeading').textContent='Каталог игр';$('collectionDescription')?.remove();$('gameSearch').value='';renderGrid();$('gameSearch').focus();});
  $('tickerToggle').addEventListener('click',()=>{const paused=$('tickerTrack').classList.toggle('paused');$('tickerToggle').textContent=paused?'▶':'Ⅱ';$('tickerToggle').setAttribute('aria-pressed',String(paused));$('tickerToggle').setAttribute('aria-label',paused?'Запустить ленту':'Приостановить ленту');});
  function renderPlan(){const p=planData[plan];$('planPrice').textContent=money(p.prices[months]);$('planDescription').textContent=p.note;document.querySelectorAll('[data-plan]').forEach(b=>{b.classList.toggle('active',b.dataset.plan===plan);b.setAttribute('aria-pressed',String(b.dataset.plan===plan));});document.querySelectorAll('[data-months]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.months)===months);b.setAttribute('aria-pressed',String(Number(b.dataset.months)===months));});}
  document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{plan=b.dataset.plan;renderPlan();}));document.querySelectorAll('[data-months]').forEach(b=>b.addEventListener('click',()=>{months=Number(b.dataset.months);renderPlan();}));
  $('planOrder').addEventListener('click',()=>{if(typeof ym==='function')ym(112697107,'reachGoal','psplus_order_click');navigator.clipboard?.writeText(`Привет! Нужна PS Plus ${planData[plan].name}, ${months} мес. На сайте ${money(planData[plan].prices[months])}.`).catch(()=>{});});
  window.addEventListener('popstate',()=>selectRoute());
  function scheduleExpiryRefresh(){
    clearTimeout(scheduleExpiryRefresh.timer);
    const next=games.flatMap(g=>g.editions.flatMap(e=>REGIONS.map(r=>Date.parse(e.discounts?.[r]?.endsAt)))).filter(t=>t>Date.now()).sort((a,b)=>a-b)[0];
    if(next)scheduleExpiryRefresh.timer=setTimeout(()=>{renderGrid();renderFeature();if(selectedGame)renderEdition();scheduleExpiryRefresh();},Math.min(next-Date.now()+1000,2147483647));
  }
  async function load(){try{const r=await fetch('/games.json',{cache:'no-store'});if(!r.ok)throw new Error('catalog');catalogData=await r.json();games=normalizeCatalog(catalogData);if(!games.length)throw new Error('empty');renderGrid();renderFeature();renderPlan();scheduleExpiryRefresh();$('updatedDate').textContent=`Цены обновлены ${catalogData.updated}`;selectRoute({scroll:false});}catch{ $('gameGrid').innerHTML=`<div class="loading">Каталог сейчас не загрузился. <button class="button secondary" id="retryCatalog">Попробовать ещё раз</button> <a class="button primary" href="${CONTACT_URL}" target="_blank" rel="noopener">Узнать цену в Telegram ↗</a></div>`;$('retryCatalog').addEventListener('click',load);}}
  load();
}

// BRAZKA order form -> Cloudflare Worker -> Telegram
(() => {
  'use strict';

  if (typeof document === 'undefined' || window.__brazkaOrderFormLoaded) return;
  window.__brazkaOrderFormLoaded = true;

  const ENDPOINT = 'https://brazka-orders.rrddturk.workers.dev/order';
  const DIRECT_TELEGRAM = 'https://t.me/m/LyEKjl0bODFi';
  const STORAGE_KEY = 'brazka-attribution';
  let currentOrder = null;
  let opener = null;

  const cleanText = value => String(value || '').replace(/\s+/g, ' ').trim();
  const text = (root, selector, fallback = '') => cleanText(root?.querySelector(selector)?.textContent) || fallback;
  const selectedText = (root, selector, childSelector, fallback = '') => {
    const selected = root?.querySelector(selector);
    return text(selected, childSelector, fallback);
  };

  function rememberAttribution() {
    const params = new URLSearchParams(location.search);
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch {}
    const yclid = params.get('yclid');
    const next = {
      utmSource: saved.utmSource || params.get('utm_source') || (yclid ? 'yandex-direct' : ''),
      utmCampaign: saved.utmCampaign || params.get('utm_campaign') || '',
      utmContent: saved.utmContent || params.get('utm_content') || (yclid ? `yclid:${yclid}` : '')
    };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function attribution() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }

  function orderFromTrigger(trigger) {
    if (trigger.id === 'gameOrder') {
      const panel = trigger.closest('#purchasePanel');
      return {
        kind: 'game',
        product: text(panel, '.purchase-kicker', text(document, '#detailView h1', 'Игра PlayStation')),
        edition: text(panel, 'h3', 'Полная версия'),
        region: selectedText(panel, '.region-option.selected', '.region-label', 'Уточнить'),
        price: selectedText(panel, '.region-option.selected', 'strong', 'Уточнить'),
        image: document.getElementById('detailCover')?.currentSrc || document.getElementById('detailCover')?.src || ''
      };
    }

    if (trigger.id === 'pointsOrder') {
      const panel = trigger.closest('.points-panel');
      return {
        kind: 'points',
        product: 'EA SPORTS FC 27',
        edition: `${text(panel, 'h3', 'FC Points')} · FC Points`,
        region: selectedText(panel, '.region-option.selected', '.region-label', 'Уточнить'),
        price: selectedText(panel, '.region-option.selected', 'strong', 'Уточнить'),
        image: document.getElementById('detailCover')?.currentSrc || document.getElementById('detailCover')?.src || ''
      };
    }

    if (trigger.id === 'planOrder') {
      const activePlan = document.querySelector('[data-plan].active');
      const activeMonths = document.querySelector('[data-months].active');
      const planName = cleanText(activePlan?.firstChild?.textContent) || 'PS Plus';
      return {
        kind: 'plus',
        product: 'PlayStation Plus',
        edition: `${planName} · ${cleanText(activeMonths?.textContent) || 'срок уточнить'}`,
        region: 'Уточнить',
        price: text(document, '#planPrice', 'Уточнить')
      };
    }

    const subscription = trigger.closest('.subscription-order');
    if (trigger.closest('#ea-play')) {
      return {
        kind: 'ea-play',
        product: 'EA Play',
        edition: text(subscription, 'h3', 'Срок уточнить'),
        region: 'Индия / Турция',
        price: 'Уточнить'
      };
    }

    return {
      kind: 'request',
      product: text(document, '#detailView h1', 'Подбор игры PlayStation'),
      edition: 'Консультация',
      region: 'Уточнить',
      price: 'Уточнить'
    };
  }

  function injectUi() {
    const style = document.createElement('style');
    style.textContent = `
      .order-modal[hidden]{display:none}.order-modal{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;background:rgba(5,7,12,.76);backdrop-filter:blur(8px)}
      .order-dialog{position:relative;width:min(100%,540px);max-height:min(92vh,760px);overflow:auto;padding:26px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:#11151f;color:#fff;box-shadow:0 28px 90px rgba(0,0,0,.55)}
      .order-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border:1px solid rgba(255,255,255,.14);border-radius:50%;background:#1b2130;color:#fff;font-size:24px;line-height:1;cursor:pointer}
      .order-eyebrow{margin:0 44px 6px 0;color:#8ba4ff;font-size:12px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.order-dialog h2{margin:0 44px 18px 0;font-size:clamp(24px,5vw,34px)}
      .order-summary{display:grid;gap:8px;margin:0 0 20px;padding:15px 17px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#171c28}.order-summary.has-cover{grid-template-columns:92px minmax(0,1fr);align-items:center}.order-summary-cover{display:block;width:92px;aspect-ratio:1;object-fit:cover;border-radius:13px;background:#0c1018;box-shadow:0 8px 24px rgba(0,0,0,.3)}.order-summary-copy{display:grid;gap:8px;min-width:0}.order-summary strong{font-size:17px}.order-summary span{color:#b9c1d1;font-size:14px}.order-summary b{color:#fff}
      .order-fields{display:grid;gap:14px}.order-label{display:grid;gap:7px;color:#e9edf5;font-size:14px;font-weight:700}.order-label input{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:#0c1018;color:#fff;font:inherit;outline:none}.order-label input:focus{border-color:#6687ff;box-shadow:0 0 0 3px rgba(102,135,255,.18)}
      .order-hint{margin:-5px 0 0;color:#929caf;font-size:12px}.order-consent{display:flex;align-items:flex-start;gap:9px;color:#aeb7c7;font-size:12px;line-height:1.4}.order-consent input{margin-top:2px;accent-color:#5878ff}.order-honeypot{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important}
      .order-submit{width:100%;min-height:50px;border:0;border-radius:13px;background:linear-gradient(135deg,#5272ff,#7657ff);color:#fff;font:inherit;font-weight:800;cursor:pointer}.order-submit:disabled{opacity:.6;cursor:wait}.order-direct{display:block;margin-top:12px;color:#aebfff;text-align:center;text-decoration:none;font-size:13px}.order-status{min-height:20px;margin:2px 0 0;color:#ff9c9c;font-size:13px}.order-status.success{color:#79e2a0}
      .order-success{text-align:center;padding:18px 0 4px}.order-success-mark{display:grid;place-items:center;width:62px;height:62px;margin:0 auto 14px;border-radius:50%;background:#173c2b;color:#72e5a0;font-size:32px}.order-success h3{margin:0 0 8px;font-size:25px}.order-success p{margin:0 0 18px;color:#b9c1d1}.order-success .order-submit{display:block;line-height:50px;text-decoration:none}
      @media(max-width:560px){.order-modal{align-items:end;padding:0}.order-dialog{width:100%;max-height:94vh;box-sizing:border-box;border-radius:24px 24px 0 0;padding:24px 18px calc(22px + env(safe-area-inset-bottom))}.order-summary.has-cover{grid-template-columns:78px minmax(0,1fr)}.order-summary-cover{width:78px;border-radius:11px}}
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'orderModal';
    modal.className = 'order-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <section class="order-dialog" role="dialog" aria-modal="true" aria-labelledby="orderTitle">
        <button class="order-close" type="button" aria-label="Закрыть форму">×</button>
        <div id="orderFormView">
          <p class="order-eyebrow">ЗАЯВКА БЕЗ ПЕРЕХОДА В ЧАТ</p>
          <h2 id="orderTitle">Оформить заказ</h2>
          <div class="order-summary" id="orderSummary"></div>
          <form class="order-fields" id="orderLeadForm" novalidate>
            <label class="order-label">Telegram
              <input id="orderTelegram" name="telegram" type="text" inputmode="text" autocomplete="username" placeholder="@username">
            </label>
            <label class="order-label">Телефон
              <input id="orderPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 999 000-00-00">
            </label>
            <p class="order-hint">Оставь Telegram или телефон — свяжемся для подтверждения цены и наличия.</p>
            <label class="order-consent"><input id="orderConsent" type="checkbox" required><span>Согласен на обработку указанного контакта только для связи по заказу.</span></label>
            <label class="order-honeypot" aria-hidden="true">Сайт<input name="website" type="text" tabindex="-1" autocomplete="off"></label>
            <p class="order-status" id="orderStatus" role="status" aria-live="polite"></p>
            <button class="order-submit" type="submit">Отправить заявку</button>
          </form>
          <a class="order-direct" href="${DIRECT_TELEGRAM}" target="_blank" rel="noopener">Или написать напрямую в Telegram ↗</a>
        </div>
        <div class="order-success" id="orderSuccess" hidden></div>
      </section>`;
    document.body.appendChild(modal);
  }

  function goal(name, params = {}) {
    if (typeof window.ym === 'function') window.ym(112697107, 'reachGoal', name, params);
  }

  function openModal(order, trigger) {
    currentOrder = order;
    opener = trigger;
    const modal = document.getElementById('orderModal');
    document.getElementById('orderFormView').hidden = false;
    document.getElementById('orderSuccess').hidden = true;
    document.getElementById('orderLeadForm').reset();
    document.getElementById('orderStatus').textContent = '';
    document.getElementById('orderStatus').className = 'order-status';
    const summary = document.getElementById('orderSummary');
    summary.className = `order-summary${order.image ? ' has-cover' : ''}`;
    summary.innerHTML = `
      ${order.image ? `<img class="order-summary-cover" src="${escapeHtml(order.image)}" alt="${escapeHtml(order.product)}" width="92" height="92" decoding="async">` : ''}
      <div class="order-summary-copy">
        <strong>${escapeHtml(order.product)}</strong>
        <span>${escapeHtml(order.edition)}</span>
        <span>${escapeHtml(order.region)} · <b>${escapeHtml(order.price)}</b></span>
      </div>`;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => document.getElementById('orderTelegram').focus());
    goal('order_form_open', { product: order.product, kind: order.kind });
    if (order.kind === 'game') goal('game_order_click');
    if (order.kind === 'points') goal('fc_points_order_click');
    if (order.kind === 'plus') goal('psplus_order_click');
  }

  function closeModal() {
    const modal = document.getElementById('orderModal');
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    opener?.focus?.({ preventScroll: true });
    opener = null;
  }

  function normalizeTelegram(value) {
    return cleanText(value).replace(/^https?:\/\/(?:www\.)?t\.me\//i, '').replace(/^@/, '').replace(/\/$/, '');
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (!currentOrder) return;
    const form = event.currentTarget;
    const telegram = normalizeTelegram(form.telegram.value);
    const phone = cleanText(form.phone.value);
    const status = document.getElementById('orderStatus');
    const button = form.querySelector('[type="submit"]');

    status.className = 'order-status';
    if (!telegram && !phone) {
      status.textContent = 'Укажи Telegram или телефон для связи.';
      form.telegram.focus();
      return;
    }
    if (telegram && !/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) {
      status.textContent = 'Проверь username Telegram: от 5 символов, латиница, цифры или _.';
      form.telegram.focus();
      return;
    }
    if (phone && (phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) {
      status.textContent = 'Проверь номер телефона.';
      form.phone.focus();
      return;
    }
    if (!document.getElementById('orderConsent').checked) {
      status.textContent = 'Нужно согласие, чтобы мы могли связаться по заявке.';
      document.getElementById('orderConsent').focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Отправляем…';
    status.textContent = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const source = attribution();
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          telegram: telegram ? `@${telegram}` : '',
          phone,
          website: form.website.value,
          product: currentOrder.product,
          edition: currentOrder.edition,
          region: currentOrder.region,
          price: currentOrder.price,
          pageUrl: location.href,
          utmSource: source.utmSource || '',
          utmCampaign: source.utmCampaign || '',
          utmContent: source.utmContent || ''
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Request failed');

      goal('lead_submit_success', { product: currentOrder.product, kind: currentOrder.kind, orderId: data.orderId });
      document.getElementById('orderFormView').hidden = true;
      const success = document.getElementById('orderSuccess');
      success.hidden = false;
      success.innerHTML = `<div class="order-success-mark">✓</div><h3>Заявка отправлена</h3><p>Номер ${escapeHtml(data.orderId || '')}. Скоро напишем и подтвердим заказ.</p><button class="order-submit" type="button" data-order-close>Готово</button>`;
      success.querySelector('[data-order-close]').focus();
    } catch (error) {
      status.textContent = error?.name === 'AbortError'
        ? 'Сервер отвечает слишком долго. Попробуй ещё раз или напиши напрямую в Telegram.'
        : 'Не удалось отправить заявку. Попробуй ещё раз или напиши напрямую в Telegram.';
      goal('lead_submit_error', { product: currentOrder.product, kind: currentOrder.kind });
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = 'Отправить заявку';
    }
  }

  function shouldHandle(trigger) {
    if (!trigger) return false;
    return Boolean(
      trigger.matches('#gameOrder, #pointsOrder, #planOrder') ||
      trigger.closest('#ea-play, #emptyState, .final-cta')
    );
  }

  rememberAttribution();
  injectUi();

  document.addEventListener('click', event => {
    const trigger = event.target.closest('a, button');
    if (shouldHandle(trigger) && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      openModal(orderFromTrigger(trigger), trigger);
      return;
    }
    if (event.target.closest('.order-close, [data-order-close]') || event.target.id === 'orderModal') closeModal();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
  });
  document.getElementById('orderLeadForm').addEventListener('submit', submitOrder);
})();
