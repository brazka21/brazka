"""Build static editorial pages and a home preview from verified article records."""
import html, json, re
from pathlib import Path
from datetime import datetime, timezone
R = Path(__file__).resolve().parent.parent
esc = html.escape
articles = json.loads((R/'news/articles.json').read_text())
data = json.loads((R/'games.json').read_text())
base = (R/'index.html').read_text()
head = base.split('</head>')[0]
header = re.search(r'<header class="store-header">.*?</header>', base, re.S).group()
header = re.sub(r'<button class="cart-button".*?</button>', '<a class="cart-button" href="/?openCart=1" aria-label="Открыть корзину">Корзина <span id="cartCount">0</span></a>', header, flags=re.S)
nav = '<nav class="site-nav shell" aria-label="Разделы сайта"><a href="/#catalog">Каталог</a><a href="/#plus">PS Plus</a><a href="/news/" aria-current="page">Новости</a></nav>'
def url(a): return '/news/'+a['slug']+'/'
def price(g):
    values=[]
    for group in data['groups']:
        for e in group['games']:
            if e['gameId'] != g or e.get('availability',{}).get('turkey') == 'unavailable': continue
            sale=e.get('discounts',{}).get('turkey',{})
            if sale.get('endsAt') and datetime.fromisoformat(sale['endsAt'].replace('Z','+00:00'))<=datetime.now(timezone.utc): continue
            p=e.get('prices',{}).get('turkey')
            if isinstance(p,(int,float)) and p>0: values.append(p)
    return ('от '+f'{min(values):,.0f}'.replace(',','\u202f')+' ₽') if values else 'Уточнить цену'
def card(a):
    return f'<a class="news-card" href="{url(a)}" data-news-link><img src="{esc(a["image"],quote=True)}" alt="{esc(a["imageAlt"])}" width="1088" height="612" loading="lazy"><div class="news-card-copy"><span class="eyebrow">{esc(a["category"])}</span><h3>{esc(a["title"])}</h3><p>{esc(a["description"])}</p><small>1 октября 2026 · 2 мин чтения <span aria-hidden="true">→</span></small></div></a>'
def product(a):
    if a['product']=='plus':
        title='PlayStation Plus';image='/assets/ps-essential.png';target='/#plus';cost='Essential · Extra · Deluxe';button='Выбрать подписку';meta='Игры месяца и другие возможности'
    else:
        g=data['titles'][a['product']];title=g['title'];image=g['image'];target='/games/'+a['product']+'/';cost=price(a['product']);button='Выбрать издание';meta=g.get('platform','PS5')+' · Турция'
    return f'<aside class="article-sidebar"><section class="news-product" data-product="{esc(a["product"])}"><p class="eyebrow">В КАТАЛОГЕ BRAZKA</p><img src="{esc(image)}" alt="{esc(title)}" width="400" height="400" loading="lazy"><h2>{esc(title)}</h2><p>{esc(meta)}</p><strong data-news-price>{esc(cost)}</strong><a class="button primary" href="{target}" data-news-product>{button} →</a><small>Наличие и цену подтвердим перед оплатой.</small></section><section class="news-related"><h2>Ещё по теме</h2>'+''.join(f'<a href="{url(b)}">{esc(b["title"])} →</a>' for b in articles if b!=a)+'</section></aside>'
def write(path,title,desc,image,body,schema=None):
    h=head
    h=re.sub(r'<title>.*?</title>', '<title>'+esc(title)+' | BRAZKA</title>',h)
    h=re.sub(r'(<meta name="description" content=")[^"]*',lambda m:m[1]+esc(desc,quote=True),h)
    h=re.sub(r'(<link rel="canonical" href=")[^"]*',lambda m:m[1]+'https://brazka.shop'+path,h)
    for key,value in [('title',title),('description',desc),('url','https://brazka.shop'+path),('image',image if image.startswith('https:') else 'https://brazka.shop'+image),('type','article' if schema else 'website')]:
        h=re.sub(r'(<meta property="og:'+key+r'" content=")[^"]*',lambda m:m[1]+esc(value,quote=True),h)
    h=re.sub(r'<meta (?:name|property)="(?:twitter:[^"]+|og:image:[^"]+)"[^>]*>','',h)
    if '/news.css' not in h: h += '<link rel="stylesheet" href="/news.css?v=1">'
    if schema:h+='<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('</','<\\/')+'</script>'
    content=h+'</head><body><a class="skip-link" href="#news-content">Перейти к материалу</a>'+header+nav+'<main class="news-main shell" id="news-content">'+body+'</main><footer class="shell news-footer"><span>© BRAZKA, 2026</span><a href="https://t.me/brazkagames" target="_blank" rel="noopener">Наш Telegram ↗</a><p>БРАЗКА не является официальным партнёром Sony или PlayStation.</p></footer><script src="/news.js?v=1" defer></script></body></html>'
    dest=R/path.strip('/')/'index.html';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(content+'\n')
write('/news/','Новости PlayStation','Новости игр PlayStation и PS Plus: важные объявления, официальные источники и переход к играм в каталоге BRAZKA.',articles[0]['image'],'<div class="news-heading"><div><p class="eyebrow">ЧИТАЙ · ВЫБИРАЙ · ИГРАЙ</p><h1>Новости PlayStation</h1><p>Главное об играх, релизах и подписках</p></div><div class="news-filters" role="group" aria-label="Фильтр новостей"><button class="filter active" data-news-filter="Все" aria-pressed="true">Все</button><button class="filter" data-news-filter="Игры" aria-pressed="false">Игры</button><button class="filter" data-news-filter="PS Plus" aria-pressed="false">PS Plus</button></div></div><div class="news-grid">'+''.join('<div data-news-category="'+a['category']+'">'+card(a)+'</div>' for a in articles)+'</div><div class="news-catalog-banner"><div><h2>Выбираешь следующую игру?</h2><p>Сравни издания и регионы в каталоге BRAZKA.</p></div><a class="button secondary" href="/#catalog" data-news-product>Открыть каталог →</a></div>')
for a in articles:
    sections=''
    for s in a['sections']:
        sections+='<section><h2>'+esc(s['heading'])+'</h2>'+''.join('<p>'+esc(p)+'</p>' for p in s.get('paragraphs',[]))
        if s.get('items'):sections+='<ul>'+''.join('<li>'+esc(p)+'</li>' for p in s['items'])+'</ul>'
        sections+='</section>'
    body='<a class="news-back" href="/news/">← Все новости</a><div class="article-layout"><article><p class="eyebrow">'+esc(a['category'])+'</p><h1>'+esc(a['title'])+'</h1><p class="article-meta">Редакция BRAZKA · <time datetime="'+a['published']+'">1 октября 2026</time> · 2 мин чтения</p><img class="article-hero" src="'+esc(a['image'])+'" alt="'+esc(a['imageAlt'])+'" width="1088" height="612"><p class="article-lead">'+esc(a['description'])+'</p><div class="article-body">'+sections+'</div><p class="article-source">Источник: <a href="'+esc(a['source'])+'" target="_blank" rel="noopener">'+esc(a['sourceName'])+' ↗</a> · '+a['sourceDate']+'</p></article>'+product(a)+'</div>'
    schema={'@context':'https://schema.org','@type':'NewsArticle','headline':a['title'],'description':a['description'],'datePublished':a['published'],'dateModified':a['published'],'image':[a['image'] if a['image'].startswith('https:') else 'https://brazka.shop'+a['image']],'author':{'@type':'Organization','name':'Редакция BRAZKA','url':'https://brazka.shop/news/'},'publisher':{'@type':'Organization','name':'BRAZKA','url':'https://brazka.shop/'},'mainEntityOfPage':'https://brazka.shop'+url(a),'citation':a['source']}
    write(url(a),a['title'],a['description'],a['image'],body,schema)
# The static links and preview are present without JavaScript.
nav_home=nav.replace(' aria-current="page"','')
if 'class="site-nav' not in base:base=base.replace('  </header>','  </header>\n  '+nav_home,1)
if '/news.css' not in base:base=base.replace('</head>','<link rel="stylesheet" href="/news.css?v=1"></head>')
preview='<!-- NEWS PREVIEW START --><section class="news-preview shell" aria-labelledby="newsPreviewTitle"><div class="news-preview-heading"><div><p class="eyebrow">НОВОСТИ PLAYSTATION</p><h2 id="newsPreviewTitle">Что нового в мире игр</h2></div><a href="/news/">Все новости →</a></div><div class="news-preview-grid">'+''.join(card(a) for a in articles)+'</div></section><!-- NEWS PREVIEW END -->'
if '<!-- NEWS PREVIEW START -->' in base:base=re.sub(r'<!-- NEWS PREVIEW START -->.*?<!-- NEWS PREVIEW END -->',preview,base,flags=re.S)
else:base=base.replace('      <section class="reviews-section',preview+'\n      <section class="reviews-section',1)
(R/'index.html').write_text(base)
sitemap=(R/'sitemap.xml').read_text();sitemap=re.sub(r'\s*<url><loc>https://brazka.shop/news/.*?</url>','',sitemap)
sitemap=sitemap.replace('</urlset>',''.join('<url><loc>https://brazka.shop'+p+'</loc><lastmod>2026-10-01</lastmod></url>\n' for p in ['/news/']+[url(a) for a in articles])+'</urlset>')
(R/'sitemap.xml').write_text(sitemap)
print('Built news index, 3 articles, home preview and sitemap entries')
