/* BK Studio — Arbejde: "Udstilling", en ny visning af alle projekter.
   Hvert projekt får sit eget kapitel: et stort billede, en kæmpe titel og en linje med fakta.
   Med mus bladrer billedet gennem projektets fotos, når man fører markøren hen over det (stregerne nederst viser, hvor man er).
   På touch skifter billedet af sig selv, mens kapitlet er i syne. Klik åbner projektet som før.
   Den gamle nummererede liste (projindex.js) er stadig der som "Indeks", og man skifter mellem de to med knapperne ved overskriften.
   Bygges ud fra `projects` i script.js, så den altid følger de samme data. */
(function () {
  'use strict';
  if (typeof projects === 'undefined') return;
  const sec = document.querySelector('.work-page .work, section.work'), grid = document.getElementById('workGrid');
  if (!sec || !grid || sec.querySelector('.pf')) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const th = src => src.replace('images/', 'images/thumbs/');
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'bkpfview';

  function open(e, id) {
    if (typeof openProject !== 'function' || !document.getElementById('overlay')) return;   // ellers følger linket bare med #id
    e.preventDefault(); openProject(id);
  }

  // ---------- visningsskift: Udstilling / Indeks ----------
  const head = sec.querySelector('.section-head');
  const sw = document.createElement('div'); sw.className = 'pf-switch'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', 'Visning');
  sw.innerHTML = '<span class="pf-total">' + pad(projects.length) + ' projekter</span>' +
    '<button type="button" data-view="show">Udstilling</button><button type="button" data-view="index">Indeks</button>';
  (head || grid).after(sw);
  function setView(v) {
    sec.dataset.view = v;
    sw.querySelectorAll('button').forEach(b => { const on = b.dataset.view === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }
  sw.addEventListener('click', e => { const b = e.target.closest('button[data-view]'); if (b) setView(b.dataset.view); });
  let start = 'show'; try { if (localStorage.getItem(KEY) === 'index') start = 'index'; } catch (e) {}
  setView(start);

  // ---------- udstillingen ----------
  const wrap = document.createElement('div'); wrap.className = 'pf';
  projects.forEach((p, i) => {
    const pics = [p.cover].concat((p.gallery || []).filter(g => g !== p.cover));
    const href = '/arbejde#' + p.id;
    const art = document.createElement('article'); art.className = 'pf-case' + (i % 2 ? ' pf-flip' : '');
    art.innerHTML =
      '<div class="pf-bar"><span class="pf-n">(' + pad(i + 1) + ')</span><span class="pf-rule" aria-hidden="true"></span>' +
        '<span class="pf-facts"><span>' + esc(p.category) + '</span><span>' + esc(p.location || '') + '</span><span>' + esc(p.year) + '</span></span></div>' +
      '<h3 class="pf-title"><a href="' + href + '">' + esc(p.title) + '</a></h3>' +
      '<a class="pf-media cursor-target" href="' + href + '" aria-label="Se projektet ' + esc(p.title.charAt(0) + p.title.slice(1).toLowerCase()) + '">' +
        '<span class="pf-frame">' + pics.map((src, j) => '<img src="' + th(src) + '" alt="" decoding="async" ' + (j ? 'loading="lazy" ' : '') + 'class="' + (j ? '' : 'on') + '">').join('') + '</span>' +
        '<span class="pf-ticks" aria-hidden="true">' + pics.map((_, j) => '<i class="' + (j ? '' : 'on') + '"></i>').join('') + '</span>' +
        '<span class="pf-hint" aria-hidden="true">' + (fine ? 'Før musen hen over' : '') + '</span>' +
      '</a>' +
      '<div class="pf-copy">' +
        '<p class="pf-sum">' + esc(p.summary || '') + '</p>' +
        '<div class="pf-foot"><span class="pf-count">' + pics.length + ' billeder</span><a class="pf-go" href="' + href + '"><span>Se projektet</span><i aria-hidden="true">→</i></a></div></div>' +
      '<div class="pf-strip" aria-hidden="true">' + pics.slice(1, 5).map(src => '<span><img src="' + th(src) + '" alt="" loading="lazy" decoding="async"></span>').join('') +
        (pics.length > 5 ? '<span class="pf-more">+' + (pics.length - 5) + '</span>' : '') + '</div>';
    art.querySelectorAll('a').forEach(a => a.addEventListener('click', e => open(e, p.id)));
    wrap.appendChild(art);

    // bladring gennem billederne
    const media = art.querySelector('.pf-media'), imgs = [...media.querySelectorAll('.pf-frame img')], ticks = [...media.querySelectorAll('.pf-ticks i')];
    let cur = 0;
    function show(k) {
      k = (k + imgs.length) % imgs.length; if (k === cur) return;
      imgs[cur].classList.remove('on'); ticks[cur].classList.remove('on');
      cur = k; imgs[cur].classList.add('on'); ticks[cur].classList.add('on');
      if (!imgs[cur].complete) imgs[cur].loading = 'eager';
    }
    art._show = show; art._cur = () => cur;
    if (fine) {
      media.addEventListener('pointerenter', () => { imgs.forEach(im => { im.loading = 'eager'; }); media.classList.add('scrub'); });
      media.addEventListener('pointermove', e => { const r = media.getBoundingClientRect(); show(Math.min(imgs.length - 1, Math.floor((e.clientX - r.left) / r.width * imgs.length))); });
      media.addEventListener('pointerleave', () => { media.classList.remove('scrub'); show(0); });
    }
  });
  sw.after(wrap);

  // kapitlerne toner ind, og på touch skifter billedet af sig selv, mens kapitlet er i syne
  const cases = [...wrap.querySelectorAll('.pf-case')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      const a = en.target;
      if (en.isIntersecting) a.classList.add('in');
      if (!fine && !reduce) {
        if (en.isIntersecting && en.intersectionRatio > .35 && !a._timer) a._timer = setInterval(() => a._show(a._cur() + 1), 1700);
        else if ((!en.isIntersecting || en.intersectionRatio <= .35) && a._timer) { clearInterval(a._timer); a._timer = 0; }
      }
    }), { threshold: [0, .15, .35, .6] });
    cases.forEach(c => io.observe(c));
  } else cases.forEach(c => c.classList.add('in'));
})();
