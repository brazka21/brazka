"""Regenerate crawlable pages after changing titles/editions. Prices stay live in games.json."""
import json,re,html
from pathlib import Path
R=Path(__file__).resolve().parent.parent
D=json.loads((R/'games.json').read_text()); esc=html.escape
collections={
 'local':('na-odnoy-ps5','Игры на двоих на одной PS5','Играйте рядом на одном телевизоре. В подборке есть игры с общим экраном и сплит-скрином; режим указан в каждой карточке.'),
 'split':('split-screen','Игры со сплит-скрином на PS5','Разделённый экран: у каждого игрока своя часть изображения. Нужны два совместимых контроллера.'),
 'online':('po-seti','Игры на двоих по сети на PS5','Для друзей на двух приставках. Проверьте совместимость версий и доступ к PS Plus; условия Friend’s Pass указаны в карточках.')}
rows=[e for group in D['groups'] for e in group['games']]
games={k:{**v,'id':k,'editions':[e for e in rows if e['gameId']==k]} for k,v in D['titles'].items()}
games={k:g for k,g in games.items() if g['editions']}
def url(g):return '/games/'+g['id']+'/'
def tile(g):
 modes=g.get('multiplayer',{}).get('label','')
 return f'<a class="game-tile" href="{url(g)}" data-game="{g["id"]}"><div class="cover-wrap"><img src="{esc(g["image"])}" alt="{esc(g["title"])}" width="400" height="400" loading="lazy"></div><p class="tile-platform">{esc(g.get("platform","PS5"))}</p><h3 class="tile-title">{esc(g["title"])}</h3>'+ (f'<p class="coop-tile-label">{esc(modes)}</p>' if modes else '') +'<p class="muted">Издания и актуальные цены →</p></a>'
nav='<nav class="collection-links" aria-label="Игры на двоих"><a class="filter" href="/#catalog">Все игры</a>'+''.join(f'<a class="filter" href="/collections/{slug}/">{esc(title.replace("Игры на двоих ","").replace("Игры со ","").replace(" на PS5", ""))}</a>' for slug,title,desc in collections.values())+'</nav>'
base=(R/'index.html').read_text()
base=re.sub(r'<!-- COLLECTIONS START -->.*?<!-- COLLECTIONS END -->','',base,flags=re.S)
base=base.replace('<div class="search-row">','<!-- COLLECTIONS START -->'+nav+'<!-- COLLECTIONS END -->\n        <div class="search-row">',1)
base=re.sub(r'<div class="game-grid" id="gameGrid" aria-live="polite">.*?</div>\s*<div class="empty-state"', '<div class="game-grid" id="gameGrid" aria-live="polite">'+''.join(tile(g) for g in games.values())+'</div>\n        <div class="empty-state"',base,flags=re.S)
base=base.replace('Для каталога включи JavaScript или','Чтобы оформить заказ,')
base=base.replace('href="./"','href="/"')
base=re.sub(r'(href|src)="(assets/|storefront\.)',r'\1="/\2',base)
base=base.replace('storefront.js?v=2','storefront.js?v=coop1').replace('storefront.css?v=2','storefront.css?v=coop1')
(R/'index.html').write_text(base)
paths=['/','/gta-6-ps5/']
def page(path,title,desc,content=None,subset=None,image=None):
 s=base
 s=re.sub(r'<title>.*?</title>','<title>'+esc(title)+' | БРАЗКА</title>',s)
 for attr,key,val in [('name','description',desc),('property','og:title',title+' | БРАЗКА'),('property','og:description',desc),('property','og:url','https://brazka.shop'+path),('name','twitter:title',title+' | БРАЗКА'),('name','twitter:description',desc)]:
  s=re.sub(r'<meta '+attr+'="'+key+r'" content="[^"]*">',f'<meta {attr}="{key}" content="{esc(val)}">',s)
 s=re.sub(r'<link rel="canonical" href="[^"]*">',f'<link rel="canonical" href="https://brazka.shop{path}">',s)
 if image:
  for attr,key in [('property','og:image'),('name','twitter:image')]:s=re.sub(r'<meta '+attr+'="'+key+r'" content="[^"]*">',f'<meta {attr}="{key}" content="{esc(image)}">',s)
  for dimension in ['width','height']:s=re.sub(r'(<meta property="og:image:'+dimension+'" content=")[^"]*',r'\g<1>1024',s)
  s=re.sub(r'<meta property="og:image:type"[^>]*>','',s)
  s=re.sub(r'(<meta (?:property="og:image:alt"|name="twitter:image:alt") content=")[^"]*',lambda m:m[1]+esc(title),s)
 if content:
  s=s.replace('<div id="storeView">','<div id="storeView" hidden>')
  s=s.replace('<section class="detail-view shell" id="detailView" hidden aria-label="Игра и издания"></section>',f'<section class="detail-view shell" id="detailView" aria-label="Игра и издания">{content}</section>')
 if subset is not None:
  s=re.sub(r'<section class="intro shell">.*?</section>','',s,flags=re.S)
  s=s.replace('<h2 id="catalogHeading">Каталог игр</h2>',f'<h1 id="catalogHeading">{esc(title)}</h1>')
  s=s.replace('<!-- COLLECTIONS START -->',f'<p id="collectionDescription" class="collection-description">{esc(desc)}</p><!-- COLLECTIONS START -->')
  start=s.index('<div class="game-grid" id="gameGrid"');end=s.index('<div class="empty-state"',start)
  s=s[:start]+'<div class="game-grid" id="gameGrid" aria-live="polite">'+''.join(tile(g) for g in subset)+'</div>'+s[end:]
 schema={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Каталог игр','item':'https://brazka.shop/'},{'@type':'ListItem','position':2,'name':title,'item':'https://brazka.shop'+path}]}
 s=s.replace('</head>','<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')+'</script></head>')
 target=R/path.strip('/')/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(s);paths.append(path)
for g in games.values():
 m=g.get('multiplayer',{});details=f'<a class="back-link" href="/" data-back>← Все игры</a><div class="detail-hero"><img class="detail-cover" src="{esc(g["image"])}" alt="{esc(g["title"])}" width="400" height="400"><div class="detail-info"><h1>{esc(g["title"])}</h1><p class="detail-description">{esc(g.get("description",""))}</p><p>{esc(g.get("platform","PS5"))}</p>'
 if m:details+=f'<section class="coop-info"><h2>Как играть вместе</h2><p>{esc(m["label"])}</p><p>{esc(m["note"])}</p></section>'
 details+='</div></div><h2>Издания</h2><div class="edition-list">'
 for e in g['editions']:
  details+=f'<section class="coop-info"><h3>{esc(e["edition"])}</h3><ul>'+''.join('<li>'+esc(f)+'</li>' for f in e.get('features',[]))+'</ul><a class="button primary" href="https://t.me/m/LyEKjl0bODFi">Уточнить цену и заказать</a></section>'
 details+='</div>'+nav
 page(url(g),g['title']+' — купить для PlayStation, издания',g.get('description','')+' Издания для Индии и Турции, оформление через Telegram.',details,image=g['image'])
for mode,(slug,title,desc) in collections.items():page('/collections/'+slug+'/',title,desc,subset=[g for g in games.values() if g.get('multiplayer',{}).get(mode)])
(R/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>https://brazka.shop{p}</loc></url>\n' for p in paths)+'</urlset>\n')
print(f'Built {len(games)} game pages, 3 collections, {len(paths)} sitemap URLs')
