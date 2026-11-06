"""Maintain news transparency, metadata and an automatically expiring news sitemap."""
import json
import re
from datetime import datetime, timedelta, timezone
from html import escape
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://brazka.shop'
EDITOR = BASE + '/news/editorial/'
records = json.loads((ROOT / 'news/articles.json').read_text())
author = {'@type': 'Organization', '@id': EDITOR + '#editorial', 'name': 'Редакция BRAZKA', 'url': EDITOR}
publisher = {'@type': 'Organization', '@id': BASE + '/#organization', 'name': 'BRAZKA', 'url': BASE + '/', 'logo': {'@type': 'ImageObject', 'url': BASE + '/assets/brazka-logo.png'}}
footer_link = '<a href="/news/editorial/">О редакции и контакты</a>'

def annotate_schema(match):
    obj = json.loads(match.group(1))
    if obj.get('@type') == 'NewsArticle':
        obj.update(author=author, publisher=publisher, isAccessibleForFree=True, inLanguage='ru-RU')
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False).replace('</', '<\\/') + '</script>'

for record in records:
    path = ROOT / 'news' / record['slug'] / 'index.html'
    if not path.exists():
        raise FileNotFoundError(path)
    text = path.read_text()
    text = re.sub(r'<script type="application/ld\+json">(.*?)</script>', annotate_schema, text, flags=re.S)
    published = datetime.fromisoformat(record['published'])
    clock = published.strftime('%H:%M')
    byline = '<a href="/news/editorial/" rel="author">Редакция BRAZKA</a>'
    # Keep original dates. Improving metadata must never make an old story look new.
    text = re.sub(r'<p class="article-meta">(.*?)</p>', lambda m: '<p class="article-meta">' + re.sub(r'<a[^>]*>Редакция BRAZKA</a>|Редакция BRAZKA', byline, m[1]) + '</p>', text, flags=re.S)
    if 'rel="author"' not in text:
        text = text.replace('<p class="article-meta">', '<p class="article-meta">' + byline + ' · ', 1)
    if '<time' not in re.search(r'<p class="article-meta">(.*?)</p>', text, re.S)[1]:
        text = re.sub(r'(<p class="article-meta">.*?)(\d+ ноября 2026)', lambda m: m[1] + '<time datetime="' + record['published'] + '">' + m[2] + ', ' + clock + ' (Владивосток)</time>', text, count=1, flags=re.S)
    else:
        text = re.sub(r'(<time[^>]*>)([^<]+)(</time>)', lambda m: m[0] if '(Владивосток)' in m[2] else m[1] + m[2] + ', ' + clock + ' (Владивосток)' + m[3], text, count=1)
    if footer_link not in text:
        text = text.replace('<footer class="shell news-footer">', '<footer class="shell news-footer">' + footer_link)
    path.write_text(text)

index = ROOT / 'news/index.html'
text = index.read_text()
if footer_link not in text:
    text = text.replace('<footer class="shell news-footer">', '<footer class="shell news-footer">' + footer_link)
index.write_text(text)

# Reuse the site's design without inventing individual reporters or a larger team.
head = text.split('</head>')[0]
head = re.sub(r'<title>.*?</title>', '<title>О редакции и контакты | BRAZKA</title>', head)
description = 'Кто выпускает новости BRAZKA, как мы работаем с источниками и куда сообщить об ошибке.'
head = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m[1] + description, head)
head = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m[1] + EDITOR, head)
for key, value in [('title', 'О редакции BRAZKA'), ('description', description), ('url', EDITOR), ('image', BASE + '/assets/og-image-v2.jpg')]:
    head = re.sub(r'(<meta property="og:' + key + r'" content=")[^"]*', lambda m: m[1] + value, head)
header = re.search(r'<header class="store-header">.*?</header>', text, re.S)[0]
nav = re.search(r'<nav class="site-nav shell".*?</nav>', text, re.S)[0]
footer = re.search(r'<footer class="shell news-footer">.*?</footer>', text, re.S)[0]
body = '''<a class="news-back" href="/news/">← Все новости</a><article style="max-width:760px"><p class="eyebrow">BRAZKA</p><h1>О редакции</h1><div class="article-body">
<section><h2>Кто выпускает новости</h2><p>BRAZKA — авторский проект Разима о PlayStation и играх. Разим ведёт проект и отвечает за публикации. Материалы выходят под общей подписью «Редакция BRAZKA».</p><p>На этом же сайте работает каталог цифровых игр и подписок. Мы открыто указываем эту связь: карточки BRAZKA в новостях ведут в наш собственный каталог.</p></section>
<section><h2>Источники и подготовка материалов</h2><p>В новостях приводим ссылки на источники: объявления разработчиков и издателей, официальные страницы игр и публикации, на которых основан материал. Подтверждённые сведения отделяем от слухов и предположений.</p><p>При подготовке текстов и оформлении сайта используются инструменты искусственного интеллекта. Ответственность за публикации остаётся за автором проекта. Иллюстрации игр принадлежат соответствующим правообладателям.</p></section>
<section><h2>Даты и исправления</h2><p>Время публикации указываем по Владивостоку (UTC+10). Первоначальная дата сохраняется. Существенные исправления и новые сведения сопровождаем пояснением и датой обновления; косметические правки не превращают старую новость в новую.</p><p>Если заметили ошибку, отправьте ссылку на материал и уточнение со ссылкой на источник.</p></section>
<section><h2>Контакты</h2><p><a href="https://t.me/m/LyEKjl0bODFi" target="_blank" rel="noopener">Написать Разиму в Telegram ↗</a></p><p><a href="https://t.me/brazkagames" target="_blank" rel="noopener">Telegram-канал BRAZKA ↗</a></p></section>
</div></article>'''
page = head + '<script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@type': 'AboutPage', 'name': 'О редакции BRAZKA', 'url': EDITOR, 'about': author}, ensure_ascii=False) + '</script></head><body><a class="skip-link" href="#news-content">Перейти к материалу</a>' + header + nav + '<main class="news-main shell" id="news-content">' + body + '</main>' + footer + '</body></html>'
dest = ROOT / 'news/editorial/index.html'
dest.parent.mkdir(exist_ok=True)
dest.write_text(page)

NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
NEWS = 'http://www.google.com/schemas/sitemap-news/0.9'
ET.register_namespace('', NS)
ET.register_namespace('news', NEWS)
root = ET.Element('{'+NS+'}urlset')
now = datetime.now(timezone.utc)
for a in records:
    when = datetime.fromisoformat(a['published'])
    if not now - timedelta(days=2) <= when <= now:
        continue
    entry = ET.SubElement(root, '{'+NS+'}url')
    ET.SubElement(entry, '{'+NS+'}loc').text = BASE + '/news/' + a['slug'] + '/'
    news = ET.SubElement(entry, '{'+NEWS+'}news')
    publication = ET.SubElement(news, '{'+NEWS+'}publication')
    ET.SubElement(publication, '{'+NEWS+'}name').text = 'BRAZKA'
    ET.SubElement(publication, '{'+NEWS+'}language').text = 'ru'
    ET.SubElement(news, '{'+NEWS+'}publication_date').text = a['published']
    ET.SubElement(news, '{'+NEWS+'}title').text = a['title']
ET.indent(root)
ET.ElementTree(root).write(ROOT / 'news-sitemap.xml', encoding='utf-8', xml_declaration=True)

sitemap = (ROOT / 'sitemap.xml').read_text()
dates = {BASE+'/news/'+a['slug']+'/': a.get('modified', a['published'])[:10] for a in records}
dates[BASE+'/news/'] = max(a.get('modified', a['published']) for a in records)[:10]
def fix_date(m):
    loc = m[1]
    return '<url><loc>'+loc+'</loc><lastmod>'+dates[loc]+'</lastmod></url>' if loc in dates else m[0]
sitemap = re.sub(r'<url><loc>([^<]+)</loc>(?:<lastmod>[^<]+</lastmod>)?</url>', fix_date, sitemap)
if EDITOR not in sitemap:
    sitemap = sitemap.replace('</urlset>', '<url><loc>'+EDITOR+'</loc></url>\n</urlset>')
(ROOT / 'sitemap.xml').write_text(sitemap)
robots = (ROOT / 'robots.txt').read_text()
if BASE+'/news-sitemap.xml' not in robots:
    (ROOT / 'robots.txt').write_text(robots.rstrip()+'\nSitemap: '+BASE+'/news-sitemap.xml\n')
print(f'Updated {len(records)} articles; news sitemap contains {len(root)} recent articles')
