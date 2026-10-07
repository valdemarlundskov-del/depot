#!/usr/bin/env python3
"""BK Studio — bygger alle HTML-sider ud fra src/data.json og skabelonerne herunder.

Kør fra projektets rod:  python3 tools/build.py
Skriver: index.html, arbejde.html, arbejde/<id>.html (én side pr. projekt), om-os.html, kontakt.html, book.html,
arkiv.html, privatlivspolitik.html, 404.html og sitemap.xml, og lægger de engelske oversættelser (TR) ind i i18n.js.
Nyt projekt: tilføj det i src/data.json (projects + billederne i media) og kør scriptet igen."""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, 'src', 'data.json'), encoding='utf-8'))
PROJECTS, MEDIA, LABELS, ARCHIVE = DATA['projects'], DATA['media'], DATA['labels'], DATA['archive']
SITE = 'https://www.bkstudio.dk'
E = lambda s: html.escape(str(s), quote=True)
TR = {}                                   # dansk → engelsk; skrives ind i i18n.js
def t(da, en): TR[da] = en; return da

# ------------------------------------------------------------------ billeder
EXTRA = {   # billeder, der ikke ligger i arkivet
  'images/om/valdemar-1400.webp': [['images/om/valdemar-800.webp', 800, 533], ['images/om/valdemar-1400.webp', 1400, 933], ['images/om/valdemar-2400.webp', 2400, 1600]],
  'images/om/basharat-1400.webp': [['images/om/basharat-800.webp', 534, 800], ['images/om/basharat-1400.webp', 935, 1400], ['images/om/basharat-2400.webp', 1603, 2400]],
  'images/thumbs/om/DSC00965.webp': [['images/thumbs/om/DSC00965.webp', 1100, 733]],
  'images/thumbs/om/A7S05300.webp': [['images/thumbs/om/A7S05300.webp', 735, 1100]],
}
def variants(src):
    if src in MEDIA: return MEDIA[src]['v']
    return EXTRA[src]
def img(src, alt='', sizes='100vw', eager=False, cls='', par=None, attrs=''):
    v = variants(src)
    big = v[-1]
    mid = v[min(1, len(v) - 1)]
    ss = ', '.join('/%s %dw' % (p, w) for p, w, h in v)
    extra = (' class="%s"' % cls if cls else '') + (' data-parallax="%s"' % par if par is not None else '') + (' ' + attrs if attrs else '')
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return '<img src="/%s" srcset="%s" sizes="%s" width="%d" height="%d" alt="%s" %s decoding="async"%s>' % (mid[0], ss, sizes, big[1], big[2], E(alt), load, extra)
def full(src): return '/' + variants(src)[-1][0]
def ratio(src): v = variants(src)[-1]; return v[1] / v[2]
def proj(pid): return next(p for p in PROJECTS if p['id'] == pid)

# ------------------------------------------------------------------ fælles dele
NAV = [('/arbejde', t('Arbejde', 'Work')), ('/#ydelser', t('Ydelser', 'Services')), ('/om-os', t('Om os', 'About')), ('/kontakt', t('Kontakt', 'Contact'))]
LANG = '<div class="lang" role="group" aria-label="Sprog / Language"><button type="button" data-lang="da" lang="da" aria-label="Dansk">DA</button><span aria-hidden="true">/</span><button type="button" data-lang="en" lang="en" aria-label="English">EN</button></div>'
STATUS = '<span class="status"><i class="dot" data-status="dot"></i><span data-status="main"></span><span aria-hidden="true">·</span><span data-status="clock" class="num"></span></span>'

def head(title, desc, path, theme='paper', og=None, extra=''):
    og = og or 'images/share/bk-studio-share.jpg'
    return f'''<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<script>try{{var q=/[?&]lang=(en|da)\\b/.exec(location.search);if((q&&q[1]==="en")||(!q&&localStorage.getItem("bklang")==="en")){{document.documentElement.classList.add("i18n-pending");setTimeout(function(){{document.documentElement.classList.remove("i18n-pending")}},2500)}}if(sessionStorage.getItem("bk-pt")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("pt-in");sessionStorage.removeItem("bk-pt")}}catch(e){{}}</script>
<style>.i18n-pending body{{visibility:hidden}}</style>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{SITE}{path}">
<meta name="theme-color" content="#0a0e16">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website"><meta property="og:site_name" content="BK Studio"><meta property="og:locale" content="da_DK">
<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{SITE}{path}">
<meta property="og:image" content="{SITE}/{og}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(title)}"><meta name="twitter:description" content="{E(desc)}"><meta name="twitter:image" content="{SITE}/{og}">
<link rel="preload" href="/fonts/inter-tight-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-latin-300-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/bk.css">
{extra}</head>
<body>
<a class="skip" href="#main">{t('Gå til indhold', 'Skip to content')}</a>
<div class="pt" aria-hidden="true"><i></i></div>
<div class="cursor" aria-hidden="true"><span class="c-logo"></span><span class="c-ring"></span></div>
'''

def header(active, theme):
    nav = ''.join('<a href="%s"%s>%s</a>' % (h, ' aria-current="page"' if h == active else '', l) for h, l in NAV)
    mnav = ''.join('<li><a href="%s">%s</a></li>' % (h, l) for h, l in NAV + [('/book', t('Start et projekt', 'Start a project'))])
    return f'''<header class="hd" data-on="{theme}">
<a class="hd-logo" href="/" aria-label="BK Studio — {t('forsiden', 'home')}"><i class="lg-b"></i><i class="lg-w"></i></a>
<nav class="hd-nav" aria-label="{t('Hovedmenu', 'Main menu')}">{nav}</nav>
<div class="hd-right">{STATUS}{LANG}<a class="btn btn-sm" href="/book">{t('Start et projekt', 'Start a project')} <span class="arr" aria-hidden="true">→</span></a><button class="hd-menu" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button></div>
</header>
<div class="mnav" id="mnav"><nav aria-label="Menu"><ol>{mnav}</ol></nav>
<div class="mnav-foot"><div class="mnav-meta label"><a href="mailto:kontakt@bkstudio.dk">kontakt@bkstudio.dk</a><a href="https://www.instagram.com/bkstudiodk/" target="_blank" rel="noopener">Instagram</a></div><div class="mnav-meta label">{STATUS}{LANG}</div></div></div>
'''

def cta():
    return f'''<section class="cta t-ink" data-theme="ink" id="kontakt" aria-label="{t('Kontakt', 'Contact')}">
<div class="wrap cta-main">
<div class="cta-copy"><div class="label-row"><span class="label">{t('Næste skridt', 'Next step')}</span></div>
<h2 class="split">{t('Har du et projekt?', 'Got a project?')}</h2>
<p data-reveal>{t('Fortæl os om din idé, så finder vi den rigtige løsning sammen.', "Tell us about your idea, and we'll find the right solution together.")}</p>
<div class="cta-actions" data-reveal style="--d:.1s"><a class="btn" href="/book">{t('Start et projekt', 'Start a project')} <span class="arr" aria-hidden="true">→</span></a><a class="ulink" href="mailto:kontakt@bkstudio.dk">kontakt@bkstudio.dk</a></div></div>
<div class="cta-3d" aria-hidden="true"><div class="logo3d" data-src="/images/logo/bk-blob.svg" data-color="#e9e2d6"></div></div>
</div>
<div class="wrap"><div class="cta-info">
<div><span class="label">{t('Skriv til os', 'Write to us')}</span><a class="ulink" href="mailto:kontakt@bkstudio.dk">kontakt@bkstudio.dk</a><a class="ulink" href="/kontakt">{t('Kontaktformular', 'Contact form')}</a></div>
<div><span class="label">{t('Følg med', 'Follow')}</span><a class="ulink" href="https://www.instagram.com/bkstudiodk/" target="_blank" rel="noopener">@bkstudiodk</a><a class="ulink" href="https://www.instagram.com/kurevisuals/" target="_blank" rel="noopener">@kurevisuals</a><a class="ulink" href="https://www.instagram.com/photo.basharat/" target="_blank" rel="noopener">@photo.basharat</a></div>
<div><span class="label">{t('Studiet', 'The studio')}</span><span>{t('Midtsjælland, Danmark', 'Central Zealand, Denmark')}</span><span>{t('Opgaver i hele landet', 'Projects all over Denmark')}</span></div>
<div><span class="label">{t('Lige nu', 'Right now')}</span>{STATUS}<span class="mute" data-status="sub"></span></div>
</div></div>
</section>'''

def footer():
    return f'''<footer class="ft t-ink" data-theme="ink"><div class="wrap">
<span>© 2026 BK Studio. {t('Alle rettigheder forbeholdes.', 'All rights reserved.')}</span>
<nav aria-label="{t('Sidefod', 'Footer')}"><a href="/arbejde">{t('Arbejde', 'Work')}</a><a href="/arkiv">{t('Arkiv', 'Archive')}</a><a href="/om-os">{t('Om os', 'About')}</a><a href="/kontakt">{t('Kontakt', 'Contact')}</a><a href="/privatlivspolitik">{t('Privatlivspolitik', 'Privacy policy')}</a></nav>
{LANG}
</div></footer>
<script src="/i18n.js"></script>
<script src="/assets/bk.js" defer></script>
</body>
</html>
'''

def page(name, title, desc, path, active, theme, body, og=None, extra='', end_cta=True):
    out = head(title, desc, path, theme, og, extra) + header(active, theme) + '<main id="main">\n' + body + '\n' + (cta() if end_cta else '') + '\n</main>\n' + footer()
    # tal og pile i egne elementer, så teksten ved siden af kan oversættes (i18n.js slår hele tekster op)
    out = re.sub(r'<span class="label">\((\d\d)\) ([^<]+)</span>', r'<span class="label">(\1) <span>\2</span></span>', out)
    out = re.sub(r'<span class="label">([^<(]+?) — (\d+)( [^<]+)?</span>', lambda m: '<span class="label"><span>%s</span> — %s%s</span>' % (m.group(1), m.group(2), ' <span>%s</span>' % m.group(3).strip() if m.group(3) else ''), out)
    out = re.sub(r'>([^<>]+?) →</', r'><span>\1</span> <span aria-hidden="true">→</span></', out)
    fn = os.path.join(ROOT, name)
    os.makedirs(os.path.dirname(fn), exist_ok=True)
    open(fn, 'w', encoding='utf-8').write(out)
    print('skrev', name)

def tags(p): return '|'.join(p['tags'])
def meta_line(p): return ' · '.join(x for x in [p['category'], p['year'], p['location']] if x)

# ================================================================== FORSIDEN
def home():
    stories_img = ''.join('<div class="story-img">%s</div>' % img(p['hero'], p['title'], '100vw', eager=(i == 0)) for i, p in enumerate(PROJECTS))
    stories_txt = ''.join(f'''<div class="story-txt"><span class="label">{E(meta_line(p))}</span><h3 class="split split-manual">{E(p['title'])}</h3><p>{E(p['summary'])}</p><a class="btn btn-light" href="/arbejde/{p['id']}" data-cursor="VIEW">{t('Se casen', 'View case')} <span class="arr" aria-hidden="true">→</span></a></div>''' for p in PROJECTS)
    # galleri: billeder på tværs af projekterne + landskab
    picks = [('vildbjerg', 'images/vildbjerg/DSC04133.webp', 'l', '0%'), ('porsche924', 'images/porsche924/DSC03343.webp', 'm', '12%'), ('thailand', 'images/thailand/DSC03771.webp', 's', '-14%'),
             ('landskab', 'images/landskab/A7S07205.webp', 'l', '6%'), ('vildbjerg', 'images/vildbjerg/DSC04225.webp', 'm', '-8%'), ('porsche924', 'images/porsche924/DSC03308.webp', 's', '16%'),
             ('thailand', 'images/thailand/DSC03544.webp', 'l', '-4%'), ('landskab', 'images/landskab/A7S07589.webp', 'm', '10%'), ('vildbjerg', 'images/vildbjerg/DSC04124.webp', 's', '-12%'),
             ('porsche924', 'images/porsche924/DSC03315.webp', 'l', '4%')]
    gal = ''
    for i, (pid, src, size, y) in enumerate(picks):
        if src not in MEDIA: continue
        href = '/arbejde/' + pid if pid != 'landskab' else '/arkiv'
        name = proj(pid)['title'] if pid != 'landskab' else t('Landskab', 'Landscape')
        cat = proj(pid)['category'] if pid != 'landskab' else t('Fra arkivet', 'From the archive')
        sizes = {'l': '(max-width:900px) 82vw, 36vw', 'm': '(max-width:900px) 62vw, 24vw', 's': '(max-width:900px) 52vw, 17vw'}[size]
        gal += f'<figure class="hg hg-{size}" style="--y:{y}"><a href="{href}" data-cursor="VIEW"><div class="ph">{img(src, name, sizes)}</div><figcaption class="hg-info label"><span>{E(name)}</span><span>{E(cat)}</span></figcaption></a><span class="hg-n label num" aria-hidden="true">BK 400 · {i+1:02d}A</span></figure>'
    svcs = [
        (t('Foto', 'Photo'), t('Portrætter, events, sport og produkter — billeder med en klar idé bag.', 'Portraits, events, sport and products — images with a clear idea behind them.'), 'images/porsche924/DSC03359.webp'),
        (t('Video', 'Video'), t('Film og korte videoer til web, sociale medier og kampagner.', 'Films and short videos for the web, social media and campaigns.'), 'VIDEO'),
        (t('Redigering', 'Editing'), t('Udvælgelse, farver og klip, så materialet står skarpt og samlet.', 'Selection, colour and cutting, so the material feels sharp and coherent.'), 'images/thailand/DSC03610.webp'),
        (t('Idéudvikling', 'Concept development'), t('Vi finder vinklen og fortællingen sammen med dig, før kameraet kommer frem.', 'We find the angle and the story with you before the camera comes out.'), 'images/landskab/A7S07641.webp'),
        (t('Produktion', 'Production'), t('Planlægning, optagedage og levering — vi står selv bag hele forløbet.', 'Planning, shoot days and delivery — we handle the whole process ourselves.'), 'images/vildbjerg/DSC04203.webp'),
    ]
    poster = '/video/showreel-poster.jpg'
    svc_bg = ''.join('<div style="background-image:url(%s)"></div>' % (poster if s == 'VIDEO' else '/' + variants(s)[0][0]) for _, _, s in svcs)
    svc_prev = ''.join(('<video muted loop playsinline preload="none" poster="%s" src="/video/showreel-sm.mp4"></video>' % poster) if s == 'VIDEO' else img(s, '', '22vw') for _, _, s in svcs)
    svc_rows = ''.join(f'''<li class="svc-row" tabindex="0"><span class="label num">{i+1:02d}</span><span class="t">{n}</span><span class="d">{d}</span><span class="a" aria-hidden="true">→</span><div class="svc-thumb ph" aria-hidden="true">{('<img src="%s" alt="" loading="lazy">' % poster) if s == 'VIDEO' else img(s, '', '88px')}</div></li>''' for i, (n, d, s) in enumerate(svcs))
    steps = [(t('Idé', 'Idea'), t('Vi starter med at forstå, hvad du vil opnå, og hvor materialet skal bruges.', 'We start by understanding what you want to achieve and where the material will be used.')),
             (t('Planlægning', 'Planning'), t('Vi lægger en plan for optagelserne og aftaler omfang, tid og levering.', 'We plan the shoot and agree on scope, timing and delivery.')),
             (t('Produktion', 'Production'), t('Vi står selv bag kameraet — på location, til eventet eller hos dig.', 'We stand behind the camera ourselves — on location, at the event or at your place.')),
             (t('Redigering', 'Editing'), t('Vi udvælger, redigerer og finpudser, så det hele hænger sammen.', 'We select, edit and refine so everything fits together.')),
             (t('Færdigt indhold', 'Finished content'), t('Du får materialet klar til brug — i de formater, du har brug for.', 'You get the material ready to use — in the formats you need.'))]
    step_html = ''.join(f'<li class="proc-step"><span class="label num">{i+1:02d} —</span><h3>{n}</h3><p>{d}</p></li>' for i, (n, d) in enumerate(steps))
    founders = founder_cards(short=True)
    body = f'''
<section class="hero" data-theme="ink" id="top">
<div class="hero-media" aria-hidden="true"><video muted loop playsinline autoplay preload="metadata" poster="/video/showreel-poster.jpg"><source data-lg="/video/showreel.mp4" data-sm="/video/showreel-sm.mp4" type="video/mp4"></video></div>
<div class="hero-shade" aria-hidden="true"></div>
<div class="hero-in">
<div class="hero-top label"><span>{t('Foto · Film · Content — Danmark', 'Photo · Film · Content — Denmark')}</span></div>
<h1 class="split">{t('Foto, film og visuel identitet.', 'Photo, film and visual identity.')}</h1>
<div class="hero-side" data-reveal style="--d:.35s"><p>{t('Vi skaber visuelt indhold, der fortæller historier, styrker brands og bliver hængende.', 'We create visual content that tells stories, strengthens brands and stays with you.')}</p><a class="btn btn-light" href="/arbejde">{t('Se vores arbejde', 'See our work')} <span class="arr" aria-hidden="true">→</span></a></div>
<div class="hero-word" aria-hidden="true"><span>BK STUDIO</span></div>
</div>
<div class="scroll-ind" aria-hidden="true"><span class="label">Scroll</span><i></i></div>
</section>

<section class="sec statement t-paper" data-theme="paper" aria-label="{t('Om studiet', 'About the studio')}">
<div class="d-xxl" aria-hidden="true"><div class="line" style="padding-left:var(--gut)">{t('Vi skaber', 'We create')}</div><div class="line" style="padding-right:var(--gut)">{t('visuelle historier.', 'visual stories.')}</div></div>
<div class="wrap statement-foot"><span class="label">(01) {t('Studiet', 'The studio')}</span><p class="lede split">{t('BK Studio er et kreativt studie for foto, film og visuelt content. Vi står selv bag kameraet og følger hver opgave fra den første idé til det færdige resultat — for virksomheder, events, brands og private.', 'BK Studio is a creative studio for photo, film and visual content. We stand behind the camera ourselves and follow every project from the first idea to the finished result — for businesses, events, brands and private clients.')}</p></div>
</section>

<section class="stories t-ink" data-theme="ink" id="udvalgt" aria-label="{t('Udvalgte projekter', 'Selected projects')}">
<div class="stories-track"><div class="stories-stage">
{stories_img}
<div class="stories-shade" aria-hidden="true"></div>
<div class="stories-ui">
<div class="stories-head"><span class="label">(02) {t('Udvalgte historier', 'Selected stories')}</span><span class="label num"><span class="stories-n">01</span> / {len(PROJECTS):02d}</span></div>
{stories_txt}
<div class="stories-foot"><div class="stories-bar" aria-hidden="true"><i></i></div><a class="label ulink" href="/arbejde">{t('Alt arbejde', 'All work')} →</a></div>
</div></div></div>
</section>

<section class="hgal t-paper2" data-theme="paper" aria-label="{t('Fra arkivet', 'From the archive')}">
<div class="wrap hgal-head sec-tight" style="padding-bottom:0"><div><div class="label-row" style="margin-bottom:24px"><span class="label">(03) {t('Fra arkivet', 'From the archive')}</span></div><h2 class="d-l split">{t('Billeder, der<br>bliver hængende.', 'Images that<br>stay with you.')}</h2></div><a class="btn btn-line" href="/arkiv">{t('Se hele arkivet', 'See the full archive')} <span class="arr" aria-hidden="true">→</span></a></div>
<div class="hgal-pin"><div class="hgal-sticky"><div class="hgal-track" data-cursor="DRAG">{gal}</div></div></div>
</section>

<section class="sec svc t-ink" data-theme="ink" id="ydelser">
<div class="svc-bg" aria-hidden="true">{svc_bg}</div>
<div class="wrap">
<div class="label-row" style="margin-bottom:28px"><span class="label">(04) {t('Ydelser', 'Services')}</span></div>
<div class="svc-head"><h2 class="d-xl split">{t('Hvad vi laver', 'What we do')}</h2><p class="lede mute" data-reveal>{t('Fra den første idé til det færdige resultat tilpasser vi hver opgave, så du ender med præcis det, du har brug for.', 'From the first idea to the finished result, we tailor every project so you end up with exactly what you need.')}</p></div>
<ol class="svc-list">{svc_rows}</ol>
</div>
<div class="svc-prev" aria-hidden="true">{svc_prev}</div>
</section>

<section class="sec proc t-paper" data-theme="paper" id="proces">
<div class="wrap proc-grid">
<div class="proc-side"><div class="proc-sticky"><div class="label-row"><span class="label">(05) {t('Proces', 'Process')}</span></div><h2 class="d-l split">{t('Sådan arbejder vi', 'How we work')}</h2><div class="proc-count" aria-hidden="true"><b>01</b><span>/ {len(steps):02d}</span></div><p class="mute" style="max-width:34ch">{t('Fra første idé til færdigt materiale — enkelt, tæt og uden en masse formularer.', 'From first idea to finished material — simple, close and without a pile of forms.')}</p></div></div>
<div class="proc-steps"><span class="proc-line" aria-hidden="true"><i></i></span><ol style="list-style:none">{step_html}</ol></div>
</div>
</section>

<section class="sec t-paper2" data-theme="paper" id="om">
<div class="wrap">
<div class="label-row" style="margin-bottom:28px"><span class="label">(06) {t('Studiet bag', 'The studio behind')}</span></div>
<h2 class="d-xl split" style="margin-bottom:clamp(56px,7vw,110px)">{t('To fotografer.<br>Ét studie.', 'Two photographers.<br>One studio.')}</h2>
<div class="founders-grid">{founders}</div>
<div class="clients" style="margin-top:clamp(80px,10vw,160px)" data-reveal><span class="label mute">{t('Vi har arbejdet for', "We've worked for")}</span><img src="/images/logo/vildbjerg_cup_logo.png" alt="Vildbjerg Cup" width="2270" height="581" loading="lazy"><img src="/images/logo/Porsche_Logo.jpg" alt="Porsche" width="960" height="581" loading="lazy"></div>
</div>
</section>
'''
    ld = '''<script type="application/ld+json">{"@context":"https://schema.org","@type":"ProfessionalService","name":"BK Studio","url":"https://www.bkstudio.dk/","description":"Foto, film og visuelt content til virksomheder, events, brands og private. Baseret i Midtsjælland, klar til opgaver i hele landet.","email":"kontakt@bkstudio.dk","areaServed":"DK","address":{"@type":"PostalAddress","addressRegion":"Midtsjælland","addressCountry":"DK"},"founder":[{"@type":"Person","name":"Valdemar Kure Lundskov"},{"@type":"Person","name":"Basharat Ullah Dar"}],"sameAs":["https://www.instagram.com/bkstudiodk/"],"knowsAbout":["Fotografi","Video","Content"]}</script>
<link rel="preload" as="image" href="/video/showreel-poster.jpg">
'''
    page('index.html', t('BK Studio — Foto, film og visuel identitet', 'BK Studio — Photo, film and visual identity'),
         t('BK Studio er et kreativt studie for foto, film og visuelt content — for virksomheder, events, brands og private. Baseret i Midtsjælland, opgaver i hele landet.', 'BK Studio is a creative studio for photo, film and visual content — for businesses, events, brands and private clients. Based in Central Zealand, working all over Denmark.'),
         '/', '/', 'ink', body, extra=ld)

def founder_cards(short):
    F = [('valdemar', 'Valdemar Kure Lundskov', t('Founder · Creative Lead · Fotograf · Videograf', 'Founder · Creative Lead · Photographer · Videographer'), 'images/om/valdemar-1400.webp', '30% 30%',
          t('Står for den kreative ledelse og arbejder selv som fotograf og videograf — med blik for stemning, detaljer og autenticitet.', 'Leads the creative direction and works as a photographer and videographer — with an eye for mood, detail and authenticity.')),
         ('basharat', 'Basharat Ullah Dar', t('Co-Founder · Fotograf · Videoredaktør · Instruktør', 'Co-Founder · Photographer · Video editor · Director'), 'images/om/basharat-1400.webp', '50% 25%',
          t('Udvikler idéerne, former det visuelle udtryk og redigerer det materiale, vi optager.', 'Develops the ideas, shapes the visual expression and edits the material we shoot.'))]
    out = ''
    for i, (fid, name, roles, src, pos, bio) in enumerate(F):
        link_open = '<a href="/om-os#%s" data-cursor="VIEW">' % fid if short else '<div>'
        link_close = '</a>' if short else '</div>'
        out += f'''<article class="founder">{link_open}<div class="tilt"><div class="ph">{img(src, name, '(max-width:900px) 100vw, 45vw', attrs='style="object-position:%s"' % pos, par='-.06')}</div></div>{link_close}
<div class="founder-meta"><div><h3>{name}</h3><p class="label mute roles">{roles}</p></div><span class="label num mute">0{i+1}</span></div>{('<p class="bio">%s</p>' % bio) if short else ''}</article>'''
    return out

# ================================================================== ARBEJDE
def work_index():
    allt = []
    for p in PROJECTS:
        for x in p['tags']:
            if x not in allt: allt.append(x)
    chips = '<button class="chip" type="button" data-filter="*" aria-pressed="true">%s <sup>%02d</sup></button>' % (t('Alle', 'All'), len(PROJECTS)) + ''.join(
        '<button class="chip" type="button" data-filter="%s" aria-pressed="false">%s <sup>%02d</sup></button>' % (E(x), t(x, {'Biler': 'Cars', 'Sport & events': 'Sport & events', 'Rejser': 'Travel'}.get(x, x)), sum(x in p['tags'] for p in PROJECTS)) for x in allt)
    works = ''
    for i, p in enumerate(PROJECTS):
        sub = next(g for g in p['gallery'] if g not in (p['hero'], p['cover']))
        works += f'''<article class="work" data-tags="{E(tags(p))}" data-work="{p['id']}">
<div class="work-media"><a class="work-main ph img-rv" href="/arbejde/{p['id']}" data-cursor="VIEW" aria-label="{E(t('Se casen', 'View case'))}: {E(p['title'])}">{img(p['hero'], p['title'], '(max-width:900px) 100vw, 64vw')}</a><div class="work-sub ph" data-parallax="-.12" aria-hidden="true">{img(sub, '', '(max-width:900px) 40vw, 22vw')}</div></div>
<div class="work-txt"><span class="label num">{i+1:02d} — {E(p['category'])}</span><h2 class="split">{E(p['title'])}</h2><p data-reveal>{E(p['intro'])}</p>
<div class="work-meta label mute" data-reveal><span>{E(p['year'])}</span><span>{E(p['location'])}</span><span>{len(p['gallery'])} {t('billeder', 'images')}</span></div>
<a class="btn" href="/arbejde/{p['id']}" data-reveal>{t('Se casen', 'View case')} <span class="arr" aria-hidden="true">→</span></a></div>
</article>'''
        t(p['intro'], {'porsche924': 'A classic Porsche 924 photographed with a focus on details, lines and the car\'s raw, timeless style.', 'vildbjerg': 'The atmosphere, the matches and the people on and around the pitch at Vildbjerg Cup.', 'thailand': 'People, places and moments captured along the way on a journey through Thailand.'}[p['id']])
    strip_srcs = [s for s in ARCHIVE if MEDIA[s]['p'] == 'landskab'][:8]
    strip = ''.join(f'<figure><a href="{full(s)}" data-lb data-cap="{E(LABELS.get(MEDIA[s]["p"], ""))}">{img(s, LABELS.get(MEDIA[s]["p"], ""), "(max-width:900px) 70vw, 30vw")}</a><figcaption>BK 400 · {i+1:02d}A</figcaption></figure>' for i, s in enumerate(strip_srcs))
    body = f'''
<section class="phero t-paper" data-theme="paper"><div class="wrap">
<div class="label-row"><span class="label">{t('Udvalgt arbejde', 'Selected work')} — {len(PROJECTS):02d}</span></div>
<h1 class="d-xxl split">{t('Arbejde', 'Work')}</h1>
<div class="phero-foot"><p class="lede" data-reveal>{t('Projekter inden for foto, film og content — fra sport og events til biler og rejser. Hvert projekt er en historie for sig.', 'Projects in photo, film and content — from sport and events to cars and travel. Every project is a story of its own.')}</p><div class="aside chips" data-filters="#works" data-reveal>{chips}</div></div>
</div></section>
<section class="sec t-paper" data-theme="paper" style="padding-top:clamp(40px,5vw,80px)"><div class="wrap works" id="works">{works}</div></section>
<section class="sec-tight t-ink" data-theme="ink">
<div class="wrap hgal-head"><div><div class="label-row" style="margin-bottom:22px"><span class="label">{t('Mere fra arkivet', 'More from the archive')}</span></div><h2 class="d-m split">{t('Træk i filmen.', 'Drag the film.')}</h2></div><a class="btn" href="/arkiv">{t('Se hele arkivet', 'See the full archive')} <span class="arr" aria-hidden="true">→</span></a></div>
<div class="strip"><div class="strip-track" data-cursor="DRAG">{strip}</div></div>
</section>'''
    page('arbejde.html', t('Arbejde — BK Studio', 'Work — BK Studio'), t('Udvalgte projekter fra BK Studio inden for foto, film og content — fra sport og events til biler og rejser.', 'Selected projects from BK Studio in photo, film and content — from sport and events to cars and travel.'), '/arbejde', '/arbejde', 'paper', body)

def case(i, p):
    g = [x for x in p['gallery'] if x != p['hero']]
    fullimg = g[0]
    grid_imgs = g[1:6]
    rest = g[6:]
    lay = ['cg-a', 'cg-b', 'cg-c', 'cg-d', 'cg-e']
    grid = ''
    for k, s in enumerate(grid_imgs):
        ar = ratio(s)
        grid += f'<figure class="{lay[k]}"><a class="ph img-rv" style="--ar:{ar:.4f}" href="{full(s)}" data-lb data-cap="{E(p["title"])}" data-cursor="VIEW">{img(s, p["title"], "(max-width:900px) 100vw, 60vw")}</a><figcaption class="label num">{k+2:02d} / {len(p["gallery"]):02d}</figcaption></figure>'
    strip = ''.join(f'<figure><a href="{full(s)}" data-lb data-cap="{E(p["title"])}">{img(s, p["title"], "(max-width:900px) 70vw, 30vw")}</a><figcaption>BK 400 · {k+8:02d}A</figcaption></figure>' for k, s in enumerate(rest))
    others = [q for q in PROJECTS if q['id'] != p['id']]
    rel = ''.join(f'<a class="rel" href="/arbejde/{q["id"]}" data-cursor="VIEW"><div class="ph img-rv">{img(q["cover"], q["title"], "(max-width:900px) 100vw, 48vw")}</div><div class="rel-meta"><h3>{E(q["title"])}</h3><span class="label mute">{E(q["category"])}</span></div></a>' for q in others)
    nxt = PROJECTS[(i + 1) % len(PROJECTS)]
    dl = [(t('Kunde', 'Client'), p.get('client')), (t('Kategori', 'Category'), p['category']), (t('Ydelser', 'Services'), ' · '.join(p['services'])), (t('År', 'Year'), p['year']), (t('Sted', 'Location'), p['location']), (t('Billeder', 'Images'), str(len(p['gallery'])))]
    dl = [(a, b) for a, b in dl if b]
    meta = ''.join(f'<div><dt class="label">{a}</dt><dd>{E(b)}</dd></div>' for a, b in dl[:4])
    dlx = ''.join(f'<dt class="label">{a}</dt><dd>{E(b)}</dd>' for a, b in dl)
    video = ''
    if p.get('video'):
        video = f'<section class="sec-tight t-ink" data-theme="ink"><div class="wrap"><div class="label-row" style="margin-bottom:28px"><span class="label">{t("Film", "Film")}</span></div><div class="case-video ph" data-cursor="PLAY"><video controls playsinline preload="none" poster="{full(p["hero"])}" src="/{p["video"]}"></video></div></div></section>'
    bts = ''
    if p.get('bts'):
        bts = '<section class="sec t-paper2" data-theme="paper"><div class="wrap"><div class="label-row" style="margin-bottom:28px"><span class="label">%s</span></div><div class="case-related">%s</div></div></section>' % (t('Bag kameraet', 'Behind the scenes'), ''.join('<figure class="ph">%s</figure>' % img(s, '', '50vw') for s in p['bts']))
    body = f'''
<section class="case-hero" data-theme="ink">
<div class="ph">{img(p['hero'], p['title'], '100vw', eager=True, par='-.18')}</div>
<div class="case-hero-in"><span class="label">Case — {i+1:02d} / {len(PROJECTS):02d}</span><h1 class="split">{E(p['title'])}</h1><dl class="case-meta">{meta}</dl></div>
</section>
<section class="sec t-paper" data-theme="paper"><div class="wrap case-intro"><p class="lede split">{E(p['summary'])}</p><dl data-reveal>{dlx}</dl></div></section>
<section class="case-full t-ink" data-theme="ink"><div class="ph">{img(fullimg, p['title'], '100vw', par='-.15')}</div></section>
<section class="sec t-paper" data-theme="paper"><div class="wrap case-grid">{grid}</div></section>
{video}{bts}
{('<section class="sec-tight t-ink" data-theme="ink"><div class="wrap hgal-head"><div><div class="label-row" style="margin-bottom:22px"><span class="label">%s</span></div><h2 class="d-m split">%s</h2></div><span class="label mute num">%02d %s</span></div><div class="strip"><div class="strip-track" data-cursor="DRAG">%s</div></div></section>' % (t('Flere billeder', 'More images'), t('Træk i filmen.', 'Drag the film.'), len(rest), t('billeder', 'images'), strip)) if rest else ''}
<section class="sec t-paper2" data-theme="paper"><div class="wrap"><div class="label-row" style="margin-bottom:40px"><span class="label">{t('Andre projekter', 'Other projects')}</span></div><div class="case-related">{rel}</div></div></section>
<a class="next t-ink" data-theme="ink" href="/arbejde/{nxt['id']}" data-cursor="VIEW"><div class="ph" aria-hidden="true">{img(nxt['hero'], '', '100vw')}</div><div class="wrap next-in"><span class="label">{t('Næste projekt', 'Next project')} →</span><h2>{E(nxt['title'])}</h2></div></a>'''
    page('arbejde/%s.html' % p['id'], '%s — BK Studio' % p['title'], p['summary'], '/arbejde/' + p['id'], '/arbejde', 'ink', body, og=variants(p['hero'])[1][0], end_cta=False)

# ================================================================== OM OS
def about():
    bios = {
      'valdemar': [t('Jeg har altid været fascineret af det visuelle — især hvordan et billede eller en video kan fortælle noget, uden at man behøver sige ret meget.', 'I have always been fascinated by the visual — especially how an image or a video can say something without needing many words.'),
                   t('Jeg er stifter af BK Studio og står for den kreative ledelse, og selv arbejder jeg som fotograf og videograf. Jeg kan godt lide hele processen fra den første idé til det færdige resultat, og jeg går meget op i, at det endelige content ikke bare ser godt ud, men faktisk passer til det brand og den historie, det skal repræsentere.', 'I founded BK Studio and lead the creative direction, and I work as a photographer and videographer myself. I enjoy the whole process from the first idea to the finished result, and I care a lot about the final content not just looking good, but actually fitting the brand and the story it represents.'),
                   t('Jeg arbejder bedst, når der er plads til at tænke kreativt, prøve ting af og finde en løsning, der føles anderledes end det forventelige. For mig handler godt content om stemning, detaljer og autenticitet — og om at skabe noget, man husker.', 'I work best when there is room to think creatively, try things out and find a solution that feels different from the expected. For me, good content is about mood, detail and authenticity — and about creating something people remember.')],
      'basharat': [t('Jeg er medstifter af BK Studio og arbejder som fotograf, videograf og redaktør. Jeg brænder især for at skabe et stærkt visuelt udtryk fra idé til færdig produktion.', 'I co-founded BK Studio and work as a photographer, videographer and editor. I am especially passionate about creating a strong visual expression from idea to finished production.'),
                   t('Jeg ser kameraet som mere end bare et værktøj. Det handler om at finde den rigtige vinkel, bevægelse, stemning og fortælling, så contentet føles levende og har en klar identitet.', 'I see the camera as more than just a tool. It is about finding the right angle, movement, mood and story, so the content feels alive and has a clear identity.'),
                   t('I BK Studio er jeg med til at udvikle idéerne og forme det visuelle udtryk, og jeg redigerer det materiale, vi optager. Jeg tror på, at det bedste content opstår, når idé, mennesker og det visuelle udtryk arbejder sammen.', 'At BK Studio I help develop the ideas and shape the visual expression, and I edit the material we shoot. I believe the best content happens when idea, people and visual expression work together.')]}
    cards = founder_cards(short=False)
    parts = re.findall(r'<article class="founder".*?</article>', cards, re.S)
    ig = {'valdemar': ('@kurevisuals', 'https://www.instagram.com/kurevisuals/'), 'basharat': ('@photo.basharat', 'https://www.instagram.com/photo.basharat/')}
    names = {'valdemar': t('Mød Valdemar', 'Meet Valdemar'), 'basharat': t('Mød Basharat', 'Meet Basharat')}
    bio_html = ''
    for k, fid in enumerate(['valdemar', 'basharat']):
        txt = ''.join('<p data-reveal>%s</p>' % x for x in bios[fid])
        bio_html += f'<section class="sec t-paper{"2" if k else ""}" data-theme="paper" id="{fid}"><div class="wrap bio{" flip" if k else ""}">{parts[k]}<div class="bio-txt"><span class="label num mute">0{k+1}</span><h2 class="d-l split" style="margin-top:18px">{names[fid]}</h2>{txt}<a class="ulink label" href="{ig[fid][1]}" target="_blank" rel="noopener">Instagram — {ig[fid][0]}</a></div></div></section>'
    body = f'''
<section class="phero t-paper" data-theme="paper"><div class="wrap">
<div class="label-row"><span class="label">{t('Om BK Studio', 'About BK Studio')}</span></div>
<h1 class="d-xxl split">{t('Studiet', 'The studio')}</h1>
<div class="phero-foot"><p class="lede" data-reveal>{t('BK Studio er et kreativt studio inden for foto, film og visuelt content, stiftet af Valdemar Kure Lundskov sammen med medstifter Basharat Ullah Dar.', 'BK Studio is a creative studio for photo, film and visual content, founded by Valdemar Kure Lundskov together with co-founder Basharat Ullah Dar.')}</p></div>
</div></section>
<section class="sec t-paper" data-theme="paper" style="padding-top:0"><div class="wrap about-split">
<div class="about-img ph img-rv">{img('images/thumbs/om/A7S05300.webp', 'BK Studio', '(max-width:900px) 100vw, 40vw', par='-.08')}</div>
<div class="body-l"><p data-reveal style="margin-bottom:1.2em">{t('Vi startede BK Studio, fordi vi gerne ville skabe noget sammen. Noget, hvor vi selv kunne stå bag kameraet, være en del af idéen og følge projekterne hele vejen fra første tanke til det færdige resultat.', 'We started BK Studio because we wanted to create something together. Something where we could stand behind the camera ourselves, be part of the idea and follow the projects all the way from the first thought to the finished result.')}</p><p data-reveal>{t('Vi arbejder med foto, video og content, men det vigtigste for os er altid det samme: at skabe noget, vi selv har lyst til at se.', 'We work with photo, video and content, but the most important thing for us is always the same: to create something we want to see ourselves.')}</p></div>
</div></section>
<section class="sec t-ink" data-theme="ink"><div class="wrap"><p class="quote split">{t('Nogle projekter er store. Andre er små. Det ændrer ikke på, hvor meget vi går op i dem.', "Some projects are big. Others are small. It doesn't change how much we care about them.")}</p></div></section>
{bio_html}'''
    page('om-os.html', t('Om os — BK Studio', 'About — BK Studio'), t('Mød BK Studio — et kreativt studie for foto, film og visuelt content, stiftet af Valdemar Kure Lundskov og Basharat Ullah Dar.', 'Meet BK Studio — a creative studio for photo, film and visual content, founded by Valdemar Kure Lundskov and Basharat Ullah Dar.'), '/om-os', '/om-os', 'paper', body)

# ================================================================== KONTAKT
FAQ = [
 (t('Hvilke opgaver kan I løse for os?', 'What kind of projects can you take on?'), t('Vi laver foto, video og content til virksomheder, foreninger, events og private — fra enkelte billeder til jeres hjemmeside og sociale medier til større opgaver som sportsfotografi og eventdækning. Omfanget tilpasser vi altid til den konkrete opgave.', 'We create photo, video and content for businesses, associations, events and private clients — from single images for your website and social media to larger jobs like sports photography and event coverage. We always tailor the scope to the specific project.')),
 (t('Hvad skal vi regne med at betale?', 'What should we expect to pay?'), t('Prisen afhænger af opgavens varighed, hvor meget materiale der skal leveres, og hvad det hele skal bruges til. I får et klart tilbud, før vi går i gang.', "The price depends on the length of the job, how much material is delivered and what it will be used for. You'll get a clear quote before we start.")),
 (t('Er I kun tilgængelige i Midtsjælland?', 'Are you only available in Central Zealand?'), t('Nej, slet ikke. Vi holder til i Midtsjælland, men kører gerne opgaver i resten af landet.', "Not at all. We're based in Central Zealand, but we're happy to take jobs in the rest of the country.")),
 (t('Skal jeg have en færdig plan, før jeg skriver til jer?', 'Do I need a finished plan before contacting you?'), t('Overhovedet ikke. Fortæl os, hvad du håber at opnå, og hvor materialet skal bruges, så finder vi sammen frem til den bedste løsning.', "Not at all. Tell us what you hope to achieve and where the material will be used, and we'll find the best solution together.")),
 (t('Hvor lang er leveringstiden?', 'How long is the delivery time?'), t('Det kommer an på opgavens omfang og typen af materiale. Vi aftaler altid en leveringstid på forhånd.', 'It depends on the scope of the job and the type of material. We always agree on a delivery time in advance.')),
 (t('Hvordan kommer vi i gang?', 'How do we get started?'), t('Send en forespørgsel via Start et projekt-siden, eller skriv direkte til os. Giv os et kort rids af opgaven, så vender vi tilbage og lægger en plan sammen.', "Send a request via the Start a project page, or write to us directly. Give us a short outline of the job, and we'll get back to you and make a plan together.")),
]
def contact():
    faq = ''.join(f'<details><summary>{q}<i aria-hidden="true"></i></summary><div class="ans"><p>{a}</p></div></details>' for q, a in FAQ)
    ld = '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}, ensure_ascii=False) + '</script>\n'
    body = f'''
<section class="phero t-paper" data-theme="paper"><div class="wrap">
<div class="label-row"><span class="label">{t('Kontakt', 'Contact')}</span></div>
<h1 class="d-xxl split">{t('Lad os tale.', "Let's talk.")}</h1>
<div class="phero-foot"><p class="lede" data-reveal>{t('Har du et projekt, en idé, eller vil du bare høre, hvad vi kan hjælpe med? Skriv kort, hvad du har brug for, så vender vi tilbage.', 'Do you have a project, an idea, or just want to hear what we can help with? Write briefly what you need, and we will get back to you.')}</p></div>
</div></section>
<section class="sec t-paper" data-theme="paper" style="padding-top:0"><div class="wrap contact-grid">
<form class="contact-form" id="contactForm" novalidate data-reveal>
<div class="fields-2"><label class="field"><span>{t('Navn', 'Name')}</span><input type="text" name="navn" required autocomplete="name"></label><label class="field"><span>{t('E-mail', 'Email')}</span><input type="email" name="email" required autocomplete="email"></label></div>
<div class="fields-2"><label class="field"><span>{t('Telefon (valgfrit)', 'Phone (optional)')}</span><input type="tel" name="telefon" autocomplete="tel"></label><label class="field"><span>{t('Virksomhed (valgfrit)', 'Company (optional)')}</span><input type="text" name="virksomhed" autocomplete="organization"></label></div>
<label class="field"><span>{t('Fortæl om dit projekt', 'Tell us about your project')}</span><textarea name="besked" rows="5"></textarea></label>
<label class="hp" aria-hidden="true">{t('Lad dette felt være tomt', 'Leave this field empty')}<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
<label class="check"><input type="checkbox" name="samtykke" required><span>{t('Jeg accepterer', 'I accept the')} <a class="link" href="/privatlivspolitik">{t('privatlivspolitikken', 'privacy policy')}</a></span></label>
<button type="submit" class="btn"><span>{t('Send besked', 'Send message')}</span> <span class="arr" aria-hidden="true">→</span></button>
<p class="form-status" id="contactStatus" aria-live="polite"></p>
</form>
<aside class="contact-aside">
<div><span class="label">{t('E-mail', 'Email')}</span><a class="ulink" href="mailto:kontakt@bkstudio.dk">kontakt@bkstudio.dk</a></div>
<div><span class="label">Instagram</span><a class="ulink" href="https://www.instagram.com/bkstudiodk/" target="_blank" rel="noopener">@bkstudiodk</a></div>
<div><span class="label">{t('Studiet', 'The studio')}</span><span class="v">{t('Midtsjælland, Danmark', 'Central Zealand, Denmark')}</span><span class="v mute">{t('Opgaver i hele landet', 'Projects all over Denmark')}</span></div>
<div><span class="label">{t('Åbningstider', 'Opening hours')}</span><p style="margin-bottom:12px">{STATUS}</p><ul class="hours" data-hours></ul></div>
<div><span class="label">{t('Hellere trin for trin?', 'Prefer step by step?')}</span><a class="btn btn-line btn-sm" href="/book">{t('Start et projekt', 'Start a project')} <span class="arr" aria-hidden="true">→</span></a></div>
</aside>
</div></section>
<section class="sec t-paper2" data-theme="paper" id="faq"><div class="wrap proc-grid">
<div class="proc-side"><div class="label-row"><span class="label">FAQ</span></div><h2 class="d-l split" style="margin-top:24px">{t('Ofte stillede spørgsmål', 'Frequently asked questions')}</h2></div>
<div class="proc-steps" style="grid-column:7/13"><div class="faq">{faq}</div></div>
</div></section>'''
    page('kontakt.html', t('Kontakt — BK Studio', 'Contact — BK Studio'), t('Kontakt BK Studio om foto, film og content. Skriv til kontakt@bkstudio.dk eller send en besked.', 'Contact BK Studio about photo, film and content. Write to kontakt@bkstudio.dk or send a message.'), '/kontakt', '/kontakt', 'paper', body, extra=ld, end_cta=False)

# ================================================================== BOOKING
def book():
    opts = [(t('Fotografering', 'Photography'), t('Beskriv opgaven på næste side', 'Describe the job on the next page'), 'Fotografering'), (t('Videoproduktion', 'Video production'), t('Beskriv opgaven på næste side', 'Describe the job on the next page'), 'Videoproduktion'),
            (t('Content', 'Content'), t('Beskriv opgaven på næste side', 'Describe the job on the next page'), 'Content'), (t('Andet', 'Other'), t('Fortæl gerne mere på næste side', 'Tell us more on the next page'), 'Andet')]
    oc = ''.join(f'<label class="option-card"><input type="radio" name="behov" value="{v}" required><span class="oc-title">{a}</span><span class="oc-sub">{b}</span></label>' for a, b, v in opts)
    body = f'''
<section class="phero t-paper" data-theme="paper" style="padding-bottom:0"><div class="wrap">
<div class="label-row"><span class="label">{t('Start et projekt', 'Start a project')}</span></div>
<h1 class="d-xl split">{t('Lad os skabe noget,<br>der føles rigtigt.', "Let's create something<br>that feels right.")}</h1>
<div class="phero-foot"><p class="lede" data-reveal>{t('Fortæl os lidt om projektet. På fem enkle trin får vi de vigtigste detaljer på plads — uden lange formularer.', 'Tell us a little about the project. In five simple steps we get the key details in place — without long forms.')}</p></div>
</div></section>
<section class="sec t-paper" data-theme="paper"><div class="wrap">
<form id="bookingForm" class="wiz" novalidate>
<label class="hp" aria-hidden="true">{t('Lad dette felt være tomt', 'Leave this field empty')}<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
<div class="wiz-top"><span class="label num">{t('Trin', 'Step')} <span id="wizardStepNum">01</span> / <span id="wizardStepTotal">05</span></span><div class="wiz-dashes" aria-hidden="true"><i class="wiz-dash"></i><i class="wiz-dash"></i><i class="wiz-dash"></i><i class="wiz-dash"></i><i class="wiz-dash"></i></div></div>
<div class="wizard-pane active"><h2 class="wiz-heading">{t('Hvad skal du bruge?', 'What do you need?')}</h2><div class="option-cards" role="radiogroup" aria-label="{t('Hvad skal du bruge?', 'What do you need?')}">{oc}</div></div>
<div class="wizard-pane"><h2 class="wiz-heading">{t('Fortæl os om idéen.', 'Tell us about the idea.')}</h2><p class="wiz-hint">{t('Et par linjer er rigeligt. Hvad skal laves, og hvor skal det foregå?', 'A few lines is plenty. What should be made, and where will it take place?')}</p><label class="field"><span>{t('Projektbeskrivelse', 'Project description')}</span><textarea name="opgave" rows="5" required></textarea></label></div>
<div class="wizard-pane"><h2 class="wiz-heading">{t('Hvornår, og hvad er rammen?', 'When, and what is the frame?')}</h2><p class="wiz-hint">{t('Har du en deadline, et ønsket tidspunkt eller et budget i tankerne? Skriv det gerne — ellers finder vi det sammen.', "Do you have a deadline, a preferred time or a budget in mind? Feel free to write it — otherwise we'll figure it out together.")}</p><label class="field"><span>{t('Ønsket tidsramme (valgfrit)', 'Preferred timeframe (optional)')}</span><input type="text" name="tidsramme"></label><label class="field"><span>{t('Budget (valgfrit)', 'Budget (optional)')}</span><input type="text" name="budget"></label></div>
<div class="wizard-pane"><h2 class="wiz-heading">{t('Hvem skal vi kunne fange?', 'Who should we get back to?')}</h2><p class="wiz-hint">{t('Vi bruger oplysningerne til at vende tilbage personligt.', 'We use the details to get back to you personally.')}</p><div class="fields-2"><label class="field"><span>{t('Navn', 'Name')}</span><input type="text" name="navn" autocomplete="name" required></label><label class="field"><span>{t('E-mail', 'Email')}</span><input type="email" name="email" autocomplete="email" required></label></div><div class="fields-2"><label class="field"><span>{t('Telefon (valgfrit)', 'Phone (optional)')}</span><input type="tel" name="telefon" autocomplete="tel"></label><label class="field"><span>{t('Virksomhed (valgfrit)', 'Company (optional)')}</span><input type="text" name="virksomhed" autocomplete="organization"></label></div></div>
<div class="wizard-pane"><h2 class="wiz-heading">{t('Sidste detaljer. Så tager vi den.', "Final details. Then we'll take it from there.")}</h2><p class="wiz-hint">{t('Tilføj det, du synes vi bør vide, og gennemgå derefter din forespørgsel.', 'Add anything you think we should know, then review your request.')}</p><label class="field"><span>{t('En sidste besked (valgfrit)', 'A final message (optional)')}</span><textarea name="besked" rows="4"></textarea></label><div class="wizard-summary" id="wizardSummary"></div><p class="wizard-privacy">{t('Ved at sende din forespørgsel giver du os lov til at kontakte dig om projektet.', 'By sending your request you allow us to contact you about the project.')}</p></div>
<div class="wiz-bottom"><button type="button" class="wizard-back" id="wizardBack" hidden>← {t('Tilbage', 'Back')}</button><button type="button" class="btn" id="wizardNext" disabled><span>{t('Næste', 'Next')}</span> <span class="arr" aria-hidden="true">→</span></button><button type="submit" class="btn" id="wizardSubmit" hidden disabled><span>{t('Send forespørgsel', 'Send request')}</span> <span class="arr" aria-hidden="true">→</span></button></div>
<p class="form-status" id="bookStatus" aria-live="polite"></p>
</form>
<p class="mute" style="margin-top:56px;font-size:14px">{t('Basharat & Valdemar svarer personligt —', 'Basharat & Valdemar reply personally —')} <a class="link" href="mailto:kontakt@bkstudio.dk">kontakt@bkstudio.dk</a></p>
</div></section>'''
    for x in ['Behov', 'Opgave', 'Tidsramme', 'Budget', 'Navn', 'E-mail', 'Telefon', 'Virksomhed']:
        t(x, {'Behov': 'Need', 'Opgave': 'Project', 'Tidsramme': 'Timeframe', 'Budget': 'Budget', 'Navn': 'Name', 'E-mail': 'Email', 'Telefon': 'Phone', 'Virksomhed': 'Company'}[x])
    page('book.html', t('Start et projekt — BK Studio', 'Start a project — BK Studio'), t('Fortæl BK Studio om dit projekt i fem enkle trin — foto, video eller content.', 'Tell BK Studio about your project in five simple steps — photo, video or content.'), '/book', '', 'paper', body, end_cta=False)

# ================================================================== ARKIV
def archive():
    counts = {}
    for s in ARCHIVE: counts[MEDIA[s]['p']] = counts.get(MEDIA[s]['p'], 0) + 1
    chips = '<button class="chip" type="button" data-filter="*" aria-pressed="true">%s <sup>%02d</sup></button>' % (t('Alle', 'All'), len(ARCHIVE)) + ''.join(
        '<button class="chip" type="button" data-filter="%s" aria-pressed="false">%s <sup>%02d</sup></button>' % (k, E(LABELS[k]), counts[k]) for k in LABELS if k in counts)
    figs = ''.join(f'<figure data-tags="{MEDIA[s]["p"]}"><a class="ph" href="{full(s)}" data-lb data-cap="{E(LABELS[MEDIA[s]["p"]])}" data-cursor="VIEW">{img(s, LABELS[MEDIA[s]["p"]], "(max-width:600px) 50vw, (max-width:1200px) 33vw, 25vw")}</a><figcaption class="label">{E(LABELS[MEDIA[s]["p"]])}</figcaption></figure>' for s in ARCHIVE)
    body = f'''
<section class="phero t-paper" data-theme="paper"><div class="wrap">
<div class="label-row"><span class="label">{t('Arkiv', 'Archive')} — {len(ARCHIVE)} {t('billeder', 'images')}</span></div>
<h1 class="d-xxl split">{t('Arkiv', 'Archive')}</h1>
<div class="phero-foot"><p class="lede" data-reveal>{t('Alle billeder samlet ét sted. Klik for at se dem stort.', 'All images in one place. Click to see them large.')}</p><div class="aside chips" data-filters="#masonry" data-reveal>{chips}</div></div>
</div></section>
<section class="sec t-paper" data-theme="paper" style="padding-top:0"><div class="wrap masonry" id="masonry">{figs}</div></section>'''
    page('arkiv.html', t('Arkiv — BK Studio', 'Archive — BK Studio'), t('Alle billeder fra BK Studio samlet ét sted — sport, biler, rejser og landskab.', 'All images from BK Studio in one place — sport, cars, travel and landscape.'), '/arkiv', '', 'paper', body, end_cta=False)

# ================================================================== JURIDISK OG 404
def legal():
    old = open(os.path.join(ROOT, 'tools', 'privatlivspolitik.html'), encoding='utf-8').read()
    body = f'''
<section class="phero t-paper" data-theme="paper"><div class="wrap">
<div class="label-row"><span class="label">{t('Juridisk', 'Legal')}</span></div>
<h1 class="d-xl split">{t('Privatlivspolitik', 'Privacy policy')}</h1>
</div></section>
<section class="sec t-paper" data-theme="paper" style="padding-top:0"><div class="wrap"><div class="legal">{old}</div></div></section>'''
    page('privatlivspolitik.html', t('Privatlivspolitik — BK Studio', 'Privacy policy — BK Studio'), t('Sådan behandler BK Studio dine personoplysninger.', 'How BK Studio processes your personal data.'), '/privatlivspolitik', '', 'paper', body, end_cta=False)

def notfound():
    body = f'''
<section class="hero" data-theme="ink" style="display:flex;align-items:flex-end">
<div class="hero-media" aria-hidden="true">{img('images/landskab/A7S07205.webp', '', '100vw', eager=True)}</div>
<div class="hero-shade" aria-hidden="true"></div>
<div class="wrap" style="position:relative;padding-bottom:clamp(40px,8vh,90px)">
<div class="label-row" style="margin-bottom:24px"><span class="label">{t('Fejl 404', 'Error 404')}</span></div>
<h1 class="d-xxl split">404</h1>
<p class="lede" style="margin:28px 0 36px;color:rgba(239,233,223,.8)">{t('Siden findes ikke — men der er masser at se andre steder.', "This page doesn't exist — but there's plenty to see elsewhere.")}</p>
<div class="cta-actions"><a class="btn btn-light" href="/">{t('Til forsiden', 'To the homepage')} <span class="arr" aria-hidden="true">→</span></a><a class="ulink" href="/arbejde">{t('Se vores arbejde', 'See our work')}</a></div>
</div></section>'''
    page('404.html', t('Siden findes ikke — BK Studio', 'Page not found — BK Studio'), t('Siden findes ikke.', 'Page not found.'), '/404', '', 'ink', body, end_cta=False)

# ================================================================== KØR
home(); work_index()
for i, p in enumerate(PROJECTS): case(i, p)
about(); contact(); book(); archive(); legal(); notfound()

# sitemap
urls = ['/', '/arbejde'] + ['/arbejde/' + p['id'] for p in PROJECTS] + ['/om-os', '/kontakt', '/book', '/arkiv', '/privatlivspolitik']
open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('  <url><loc>%s%s</loc></url>\n' % (SITE, u) for u in urls) + '</urlset>\n')

# oversættelser → i18n.js (mellem markørerne; ældre poster med samme nøgle overskrives ikke)
i18n = open(os.path.join(ROOT, 'i18n.js'), encoding='utf-8').read()
A, B = ' /* build.py: start */\n', ' /* build.py: slut */\n'
if A in i18n: i18n = i18n[:i18n.index(A)] + i18n[i18n.index(B) + len(B):]
existing = set(re.findall(r'^ "((?:[^"\\]|\\.)*)":', i18n, re.M))
block = ''.join(' %s: %s,\n' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False)) for k, v in TR.items() if k != v and json.dumps(k, ensure_ascii=False)[1:-1] not in existing)
anchor = '  var EN = {\n'
i18n = i18n.replace(anchor, anchor + A + block + B, 1)
open(os.path.join(ROOT, 'i18n.js'), 'w', encoding='utf-8').write(i18n)
print('oversættelser:', block.count('\n'))
