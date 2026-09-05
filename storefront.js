'use strict';
const CONTACT_URL = 'https://t.me/m/LyEKjl0bODFi';
const REGIONS = ['india', 'turkey'];
const REGION_LABELS = {india:'🇮🇳 Индия',turkey:'🇹🇷 Турция'};
const money = value => Number.isFinite(value) && value > 0 ? new Intl.NumberFormat('ru-RU').format(value) + ' ₽' : 'Уточнить';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanSearch = value => String(value).toLowerCase().replace(/[™®’'`]/g,'').replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,' ').trim();
function activeDiscount(edition, region, now=Date.now()) {
  const sale = edition.discounts?.[region];
  return sale && sale.percent > 0 && Date.parse(sale.endsAt) > now ? sale : null;
}
function currentPrice(edition, region, now=Date.now()) {
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
  const matches=games.filter(g=>words.every(w=>g.search.includes(w))&&(words.length||filter==='all'||(filter==='sale'&&maxDiscount(g)>0)||(filter==='premium'&&g.editions.some(e=>/deluxe|ultimate|premium|vault|gold|eclipse|ultra/i.test(e.edition)))||(filter==='preorder'&&Date.parse(g.releaseDate)>Date.now())));
  return matches.sort((a,b)=>sort==='price-asc'?lowestPrice(a)-lowestPrice(b):sort==='price-desc'?lowestPrice(b)-lowestPrice(a):sort==='title'?a.title.localeCompare(b.title,'ru'):(a.priority??99)-(b.priority??99));
}
function gameUrl(game,edition){const u=new URLSearchParams({game:game.id});if(edition)u.set('edition',edition.editionId);return '?'+u.toString();}
if(typeof module!=='undefined'&&module.exports)module.exports={normalizeCatalog,filterGames,activeDiscount,currentPrice,minPrice,money,cleanSearch};
if(typeof document!=='undefined'){
  let games=[],catalogData,query='',filter='all',sort='featured',selectedGame,selectedEdition,selectedRegion='india',catalogScroll=0;
  const $=id=>document.getElementById(id);
  const rootTitle=document.title;
  const planData={essential:{name:'Essential',note:'Онлайн, игры месяца и облачные сохранения.',prices:{1:1090,3:2990,12:7900}},extra:{name:'Extra',note:'Каталог игр и все возможности Essential.',prices:{1:1590,3:4290,12:11990}},deluxe:{name:'Deluxe',note:'Классика, пробные версии и все возможности Extra.',prices:{1:1790,3:4790,12:13990}}};
  let plan='essential',months=1;
  function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,5000);}
  function tile(game){
    const sale=maxDiscount(game),ind=minPrice(game,'india'),tr=minPrice(game,'turkey'),best=Math.min(ind??Infinity,tr??Infinity);
    return `<a class="game-tile" href="${gameUrl(game)}" data-game="${escapeHtml(game.id)}" aria-label="${escapeHtml(game.title)} — выбрать издание"><div class="cover-wrap"><img src="${escapeHtml(game.image)}" alt="${escapeHtml(game.title)}" loading="lazy" decoding="async" width="400" height="400"><div class="tile-badges">${sale?`<span class="sale-badge">−${sale}% PS Store</span>`:''}<span class="edition-count">${game.editions.length} изд.</span></div></div><p class="tile-platform">${escapeHtml(game.platform||'PS5')}${Date.parse(game.releaseDate)>Date.now()?' · ПРЕДЗАКАЗ':''}</p><h3 class="tile-title">${escapeHtml(game.title)}</h3><div class="tile-regions">${REGIONS.map(r=>{const p=r==='india'?ind:tr;return `<div class="tile-region ${p===best?'best':''}"><span>${REGION_LABELS[r]}</span><strong class="${sale?'sale-pulse':''}">${p&&game.editions.length>1?'<small>от</small>':''}${money(p)}</strong></div>`}).join('')}</div></a>`;
  }
  function renderGrid(){
    const matches=filterGames(games,{query,filter,sort});$('gameGrid').innerHTML=matches.map(tile).join('');$('gameGrid').hidden=!matches.length;$('emptyState').hidden=!!matches.length;
    $('catalogCount').textContent=query?`${matches.length} из ${games.length}`:`${games.length} игр`;
    $('saleCount').textContent=games.filter(g=>maxDiscount(g)>0).length;
    $('searchContext').hidden=!(query&&filter!=='all');$('searchContext').textContent='Поиск по всем играм, включая скидки и предзаказы';
    document.querySelectorAll('[data-filter]').forEach(b=>{const active=!query&&b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  function renderFeature(){
    const gta=games.find(g=>g.id==='gta-vi');if(!gta)return;
    const ultimate=gta.editions.find(e=>/ultimate/i.test(e.edition))||gta.editions[0];
    const price=Math.min(...REGIONS.map(r=>currentPrice(ultimate,r)??Infinity));
    $('featureBanner').innerHTML=`<img class="feature-art" src="assets/gta6-jason-lucia-main.jpg" alt="Джейсон и Люсия — Grand Theft Auto VI" width="1400" height="500" fetchpriority="high"><div class="feature-copy"><p class="eyebrow">В ЦЕНТРЕ ВНИМАНИЯ · ПРЕДЗАКАЗ</p><h2>Grand Theft Auto VI</h2><p>${escapeHtml(ultimate.edition)} · ${escapeHtml(gta.release||'19 ноября')}</p><div class="feature-bottom"><span class="feature-price"><small>от</small> ${money(price)}</span><a class="button primary" href="${gameUrl(gta,ultimate)}" data-game="${gta.id}" data-edition="${ultimate.editionId}">Выбрать издание ↗</a></div></div>`;
    const picks=[{game:gta,edition:ultimate},...games.filter(g=>maxDiscount(g)>0).sort((a,b)=>maxDiscount(b)-maxDiscount(a)).slice(0,5).map(game=>({game,edition:game.editions.filter(e=>REGIONS.some(r=>activeDiscount(e,r))).sort((a,b)=>Math.min(...REGIONS.map(r=>currentPrice(a,r)??Infinity))-Math.min(...REGIONS.map(r=>currentPrice(b,r)??Infinity)))[0]}))];
    const seg=picks.map(({game,edition})=>{const p=Math.min(...REGIONS.map(r=>currentPrice(edition,r)??Infinity));return `<a class="ticker-offer" href="${gameUrl(game,edition)}" data-game="${game.id}" data-edition="${edition.editionId}"><span>${escapeHtml(game.title)} · ${escapeHtml(edition.edition)}</span><b>${money(p)}</b></a>`}).join('');
    $('tickerTrack').innerHTML=`<div class="ticker-segment">${seg}</div><div class="ticker-segment" aria-hidden="true">${seg.replaceAll('<a ','<a tabindex="-1" ')}</div>`;$('offersStrip').hidden=false;
  }
  function detailShell(game){
    $('detailView').innerHTML=`<a class="back-link" href="./" data-back>← Все игры</a><div class="detail-hero"><img id="detailCover" class="detail-cover" src="${escapeHtml(selectedEdition.image||game.image)}" alt="${escapeHtml(game.title)} — ${escapeHtml(selectedEdition.edition)}" width="400" height="400"><div class="detail-info"><p class="eyebrow">PLAYSTATION · ВЫБЕРИ СВОЁ ИЗДАНИЕ</p><h1 tabindex="-1">${escapeHtml(game.title)}</h1><p class="detail-description">${escapeHtml(game.description||'Сравни издания и выбери регион своего аккаунта.')}</p><div class="detail-meta"><span>${escapeHtml(game.platform||'PS5')}</span><span>${escapeHtml(game.release||'Уже в продаже')}</span><span>Изданий: ${game.editions.length}</span></div><p class="detail-intro-prices">от ${money(lowestPrice(game))}</p></div><p class="detail-description">${escapeHtml(game.description||'Сравни издания и выбери регион своего аккаунта.')}</p></div><div class="editions-heading"><h2>Выбери издание</h2><span class="muted">Полные версии игры</span></div><div class="edition-layout"><div class="edition-list" id="editionList" role="group" aria-label="Издания игры"></div><aside class="purchase-panel" id="purchasePanel" aria-label="Выбранное издание и заказ"></aside></div><section class="related-section"><div class="section-heading"><h2>Ещё в каталоге</h2></div><div class="game-grid">${games.filter(g=>g.id!==game.id).sort((a,b)=>(a.priority??99)-(b.priority??99)).slice(0,6).map(tile).join('')}</div></section>`;
    renderEdition();
  }
  function renderEdition(){
    const game=selectedGame,edition=selectedEdition;
    const cover=$('detailCover');cover.src=edition.image||game.image;cover.alt=`${game.title} — ${edition.edition}`;
    $('editionList').innerHTML=game.editions.map(e=>{const p=Math.min(...REGIONS.map(r=>currentPrice(e,r)??Infinity)),discount=Math.max(...REGIONS.map(r=>activeDiscount(e,r)?.percent||0));return `<button class="edition-choice ${e.editionId===edition.editionId?'selected':''}" data-select-edition="${escapeHtml(e.editionId)}" aria-pressed="${e.editionId===edition.editionId}"><img class="edition-thumb" src="${escapeHtml(e.image||game.image)}" alt="" width="68" height="68" loading="lazy"><span><span class="edition-name">${escapeHtml(e.edition)}</span><span class="edition-summary">${escapeHtml(e.summary||'Полная игра')}</span></span><span class="edition-from"><small>от</small>${money(p)}${discount?`<span class="sale-badge">−${discount}% в PS Store</span>`:''}</span></button>`}).join('');
    renderPurchase();
  }
  function renderPurchase(){
    const game=selectedGame,e=selectedEdition;
    const sale=activeDiscount(e,selectedRegion),price=currentPrice(e,selectedRegion);
    $('purchasePanel').innerHTML=`<p class="purchase-kicker">${escapeHtml(game.title)}</p><h3>${escapeHtml(e.edition)}</h3><div class="region-options" role="group" aria-label="Регион аккаунта">${REGIONS.map(r=>{const p=currentPrice(e,r),discount=activeDiscount(e,r),old=e.oldPrices?.[r];return `<button class="region-option ${r===selectedRegion?'selected':''}" data-region="${r}" aria-pressed="${r===selectedRegion}"><span class="region-label">${REGION_LABELS[r]}</span><strong>${money(p)}</strong>${discount&&old>p?`<del>${money(old)}</del>`:''}${discount?`<span class="sale-badge">−${discount.percent}% в PS Store</span>`:''}</button>`}).join('')}</div>${sale?`<p class="sale-timing">Скидка в PS Store до ${new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(sale.endsAt))}</p>`:''}<a class="button primary order-cta" href="${CONTACT_URL}" target="_blank" rel="noopener" id="gameOrder">${price?'Заказать за '+money(price):'Уточнить цену в Telegram'} ↗</a><p class="order-context">${REGION_LABELS[selectedRegion]} · ${escapeHtml(e.edition)}<br>Детали заказа скопируем для отправки в чат.</p><div class="edition-includes"><h4>Что входит</h4><ul>${(e.features?.length?e.features:['Полная версия игры']).map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul></div>${e.notice?`<p class="edition-notice">${escapeHtml(e.notice)}</p>`:''}<button class="order-copy" id="copyOrder">Скопировать заказ</button>`;
  }
  function orderText(){return `Привет! Хочу заказать ${selectedGame.title}, ${selectedEdition.edition}. Регион: ${selectedRegion==='india'?'Индия':'Турция'}. Цена на сайте: ${money(currentPrice(selectedEdition,selectedRegion))}. ${location.origin}/${gameUrl(selectedGame,selectedEdition)}`;}
  function selectRoute({scroll=true}={}){
    const params=new URLSearchParams(location.search),id=params.get('game');
    const game=games.find(g=>g.id===id);
    if(!id){$('storeView').hidden=false;$('detailView').hidden=true;document.title=rootTitle;selectedGame=null;if(scroll)requestAnimationFrame(()=>window.scrollTo(0,catalogScroll));return;}
    $('storeView').hidden=true;$('detailView').hidden=false;
    if(!game){$('detailView').innerHTML='<a class="back-link" href="./" data-back>← Все игры</a><div class="empty-state"><h1>Игра не найдена</h1><p>Вернись в каталог или напиши нам — найдём нужное издание.</p><a class="button primary" href="'+CONTACT_URL+'" target="_blank" rel="noopener">Написать ↗</a></div>';return;}
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
    const back=event.target.closest('[data-back]');if(back){event.preventDefault();history.pushState({},'','./');selectRoute();return;}
    const choice=event.target.closest('[data-select-edition]');if(choice){selectedEdition=selectedGame.editions.find(e=>e.editionId===choice.dataset.selectEdition);history.replaceState({game:selectedGame.id},'',gameUrl(selectedGame,selectedEdition));renderEdition();$('editionList').querySelector(`[data-select-edition="${selectedEdition.editionId}"]`)?.focus({preventScroll:true});return;}
    const region=event.target.closest('[data-region]');if(region){selectedRegion=region.dataset.region;renderPurchase();$('purchasePanel').querySelector(`[data-region="${selectedRegion}"]`)?.focus({preventScroll:true});return;}
    if(event.target.closest('#copyOrder')){if(!navigator.clipboard){toast('Копирование недоступно. Напиши название игры и издание в чате.');return;}navigator.clipboard.writeText(orderText()).then(()=>toast('Заказ скопирован')).catch(()=>toast('Не удалось скопировать — выбери название игры и издание в чате.'));return;}
    if(event.target.closest('#gameOrder')){navigator.clipboard?.writeText(orderText()).catch(()=>{});return;}
  });
  $('gameSearch').addEventListener('input',e=>{query=e.target.value;renderGrid();});
  $('gameSort').addEventListener('change',e=>{sort=e.target.value;renderGrid();});
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{query='';$('gameSearch').value='';filter=b.dataset.filter;renderGrid();}));
  $('resetSearch').addEventListener('click',()=>{query='';filter='all';$('gameSearch').value='';renderGrid();$('gameSearch').focus();});
  $('tickerToggle').addEventListener('click',()=>{const paused=$('tickerTrack').classList.toggle('paused');$('tickerToggle').textContent=paused?'▶':'Ⅱ';$('tickerToggle').setAttribute('aria-pressed',String(paused));$('tickerToggle').setAttribute('aria-label',paused?'Запустить ленту':'Приостановить ленту');});
  function renderPlan(){const p=planData[plan];$('planPrice').textContent=money(p.prices[months]);$('planDescription').textContent=p.note;document.querySelectorAll('[data-plan]').forEach(b=>{b.classList.toggle('active',b.dataset.plan===plan);b.setAttribute('aria-pressed',String(b.dataset.plan===plan));});document.querySelectorAll('[data-months]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.months)===months);b.setAttribute('aria-pressed',String(Number(b.dataset.months)===months));});}
  document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{plan=b.dataset.plan;renderPlan();}));document.querySelectorAll('[data-months]').forEach(b=>b.addEventListener('click',()=>{months=Number(b.dataset.months);renderPlan();}));
  $('planOrder').addEventListener('click',()=>navigator.clipboard?.writeText(`Привет! Нужна PS Plus ${planData[plan].name}, ${months} мес. На сайте ${money(planData[plan].prices[months])}.`).catch(()=>{}));
  window.addEventListener('popstate',()=>selectRoute());
  function scheduleExpiryRefresh(){
    clearTimeout(scheduleExpiryRefresh.timer);
    const next=games.flatMap(g=>g.editions.flatMap(e=>REGIONS.map(r=>Date.parse(e.discounts?.[r]?.endsAt)))).filter(t=>t>Date.now()).sort((a,b)=>a-b)[0];
    if(next)scheduleExpiryRefresh.timer=setTimeout(()=>{renderGrid();renderFeature();if(selectedGame)renderEdition();scheduleExpiryRefresh();},Math.min(next-Date.now()+1000,2147483647));
  }
  async function load(){try{const r=await fetch('games.json',{cache:'no-store'});if(!r.ok)throw new Error('catalog');catalogData=await r.json();games=normalizeCatalog(catalogData);if(!games.length)throw new Error('empty');renderGrid();renderFeature();renderPlan();scheduleExpiryRefresh();$('updatedDate').textContent=`Цены обновлены ${catalogData.updated}`;selectRoute({scroll:false});}catch{ $('gameGrid').innerHTML=`<div class="loading">Каталог сейчас не загрузился. <button class="button secondary" id="retryCatalog">Попробовать ещё раз</button> <a class="button primary" href="${CONTACT_URL}" target="_blank" rel="noopener">Узнать цену в Telegram ↗</a></div>`;$('retryCatalog').addEventListener('click',load);}}
  load();
}
