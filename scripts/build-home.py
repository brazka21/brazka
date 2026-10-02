"""Build the homepage shelves from live catalogue records; preserve checkout UI."""
import json,re,html
from pathlib import Path
from datetime import datetime,timezone,timedelta
R=Path(__file__).resolve().parent.parent
D=json.loads((R/'games.json').read_text());esc=html.escape
now=datetime.now(timezone.utc)
rows=[e for group in D['groups'] for e in group['games']]
games=[dict(v,id=k,editions=[e for e in rows if e['gameId']==k]) for k,v in D['titles'].items()]
games=[g for g in games if g['editions']]
def release(g):
 try:return datetime.fromisoformat(g['releaseDate']).replace(tzinfo=timezone.utc)
 except (KeyError,ValueError):return datetime.min.replace(tzinfo=timezone.utc)
def price(g):
 vals=[e.get('prices',{}).get('turkey') for e in g['editions'] if e.get('availability',{}).get('turkey')!='unavailable' and (not e.get('discounts',{}).get('turkey',{}).get('endsAt') or datetime.fromisoformat(e['discounts']['turkey']['endsAt'].replace('Z','+00:00'))>now)]
 vals=[p for p in vals if isinstance(p,(int,float)) and p>0]
 return 'от '+f'{min(vals):,.0f}'.replace(',','\u202f')+' ₽' if vals else 'Уточнить цену'
def card(g,pre=False):
 return '<a class="home-game" href="/games/'+g['id']+'/" data-home-game="'+g['id']+'"><div class="home-cover"><img src="'+esc(g['image'],quote=True)+'" alt="'+esc(g['title'],quote=True)+'" width="400" height="400" loading="lazy">'+('<span class="home-badge">Предзаказ</span>' if pre else '')+'</div><p class="home-platform">'+esc(g.get('platform','PS5'))+'</p><h3>'+esc(g['title'])+'</h3><div class="home-game-bottom"><span data-home-price>'+price(g)+'</span><span class="home-select">Выбрать →</span></div><small>Турция · Индия — уточнить цену</small></a>'
def shelf(title,kind,picks):
 if not picks:return ''
 return '<section class="home-shelf shell"><div class="home-section-heading"><h2>'+title+'</h2><a href="/catalog/?filter='+kind+'">Смотреть все →</a></div><div class="home-shelf-track">'+''.join(card(g,kind=='preorder') for g in picks[:4])+'</div></section>'
new=sorted([g for g in games if now-timedelta(days=30)<=release(g)<=now],key=lambda g:release(g),reverse=True)
pre=sorted([g for g in games if release(g)>now],key=lambda g:(g['id']!='gta-vi',g.get('priority',99),release(g)))
hero='''<section class="home-hero shell" aria-labelledby="homeTitle"><img src="/assets/gta6-robbery-hero.jpg" alt="Джейсон и Люсия — официальный арт Grand Theft Auto VI, Rockstar Games" width="2048" height="1152" fetchpriority="high"><div class="home-hero-copy"><p class="eyebrow">В ЦЕНТРЕ ВНИМАНИЯ</p><h1 id="homeTitle"><img class="home-hero-logo" src="/assets/gta6-logo.png" alt="Grand Theft Auto VI" width="580" height="440"></h1><p class="home-hero-price">от 8 800 ₽</p><div class="home-hero-actions"><a class="button primary" href="/games/gta-vi/">Смотреть игру →</a><a class="button secondary" href="/news/gta-vi-screenshots-leonida-details/">Новости GTA VI</a></div></div></section>'''
news=json.loads((R/'news/articles.json').read_text())
news_html='<section class="home-news shell"><div class="home-section-heading"><h2>Новости PlayStation</h2><a href="/news/">Все новости →</a></div><div class="home-news-grid">'+''.join('<a class="home-news-card" href="/news/'+a['slug']+'/"><img src="'+esc(a['image'],quote=True)+'" alt="'+esc(a['imageAlt'],quote=True)+'" width="300" height="169" loading="lazy"><div><small>'+esc(a['category'])+'</small><h3>'+esc(a['title'])+'</h3><span>Читать →</span></div></a>' for a in news[:2])+'</div></section>'
s=(R/'catalog/index.html').read_text()
s=s.replace('<body>','<body class="home-page">')
s=re.sub(r'<section class="catalog-intro shell">.*?</section>',hero+shelf('Новинки','new',new)+shelf('Предзаказы','preorder',pre)+news_html,s,flags=re.S)
s=s.replace('<section class="catalog-section shell"','<section hidden class="catalog-section shell"')
s=s.replace('<div class="offers-strip"','<div style="display:none" class="offers-strip"')
s=re.sub(r'<!-- NEWS PREVIEW START -->.*?<!-- NEWS PREVIEW END -->','',s,flags=re.S)
s=re.sub(r'<title>.*?</title>','<title>BRAZKA — игры PlayStation, новости и PS Plus</title>',s)
s=re.sub(r'<link rel="canonical" href="[^"]*">','<link rel="canonical" href="https://brazka.shop/">',s)
s=re.sub(r'(<meta property="og:url" content=")[^"]*',r'\g<1>https://brazka.shop/',s)
s=re.sub(r'(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*',r'\g<1>BRAZKA — игры PlayStation, новости и PS Plus',s)
s=s.replace('href="#catalog"','href="/catalog/"')
s=s.replace('href="/">Главная','href="/" aria-current="page">Главная')
s=s.replace('</body>','<aside class="home-plus-dock" id="homePlusDock" hidden aria-label="Оформить PlayStation Plus"><img src="/assets/psplus-icon.png" alt="" width="32" height="32"><div><strong>PS Plus</strong><small>Essential · Extra · Deluxe</small></div><a class="button primary" href="#plus">Оформить →</a></aside></body>')
s=s.replace('</head>','<script>if(location.hash==="#catalog")location.replace("/catalog/"+location.search);</script></head>')
s=s.replace('</body>','<script src="/home.js?v=2" defer></script></body>')
(R/'index.html').write_text(s)
print(f'Built homepage: {len(new)} recent releases, {len(pre)} preorders')
