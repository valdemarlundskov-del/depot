// BK Studio — globale effekter på alle sider: sidetransition, scroll-linje, header, overskrifter, billed-reveal, magnetiske knapper, markør, footer-ord.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(any-hover:hover) and (any-pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  const visMsp = () => [...document.querySelectorAll('.msp')].find(s => s.offsetParent !== null);
  const heroEl = $('.hero, .page-hero') || visMsp();
  const nav0 = $('#primaryNav');
  const managed = !!$('[data-thru]');   // forsiden styrer selv menuens tilstand (thru.js)
  if (!$('#intro') && !window.__fontsGate) body.classList.add('ready');
  setTimeout(() => body.classList.add("ready"), 14000);
  if (!heroEl && !managed) body.classList.add('hdr-solid');

  // menu: antal projekter + kontaktinfo i fuldskærmsmenuen
  if (nav0) {
    const x = document.createElement('div'); x.className = 'nav-extra';
    x.innerHTML = '<div><span>Kontakt</span><a href="mailto:kontakt@bkstudio.dk">kontakt@bkstudio.dk</a><p>Midtsjælland, Danmark</p></div><div><span>Sociale medier</span><a href="https://www.instagram.com/bkstudiodk/" target="_blank" rel="noopener">Instagram</a><a href="https://www.instagram.com/photo.basharat/" target="_blank" rel="noopener">Basharat</a><a href="https://www.instagram.com/kurevisuals/" target="_blank" rel="noopener">Valdemar</a></div>';
    nav0.appendChild(x);
  }

  // spring til indhold (tastatur)
  const mainEl = $('main');
  if (mainEl) { if (!mainEl.id) mainEl.id = 'main'; const sk = document.createElement('a'); sk.className = 'skip'; sk.href = '#' + mainEl.id; sk.textContent = 'Hop til indhold'; body.prepend(sk); }
  // scroll-linje
  const bar = document.createElement('div'); bar.className = 'pbar'; body.appendChild(bar);

  // Sideskift: ingen mellemscene. Linket går direkte til den nye side, som vises, så snart den er indlæst.
  // Vi husker kun, at det var et internt skift, så den nye side ikke viser sin åbning igen.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target && a.target !== '_self') return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || a.hasAttribute('download')) return;
    // samme side: et link til den side, man allerede er på, må ikke genindlæse den (ingen åbning, ingen animationer)
    const norm = p => p.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/(.)\/+$/, '$1');
    const sq = s => { const q = new URLSearchParams(s); q.delete('lang'); const r = q.toString(); return r ? '?' + r : ''; };       // sprogvalget i adressen (?lang=en) tæller ikke med
    if (norm(u.pathname) === norm(location.pathname) && sq(u.search) === sq(location.search)) {
      if (u.hash && u.hash !== '#') return;                                      // spring til et afsnit på samme side: som før
      e.preventDefault();                                                        // ellers sker der ingenting
      const nv = document.getElementById('primaryNav'), mb = document.getElementById('menuBtn');
      if (nv && mb && nv.classList.contains('open')) mb.click();                 // men en åben mobilmenu lukkes (dropdown'en lukker sig selv)
      return;
    }
    try { sessionStorage.setItem('bknav', '1'); } catch (err) {}
  });

  // Danmark-baggrunden bag kontaktformularen: størrelsen tilpasses sektionen, så hele kortet (top og bund) altid kan ses på alle skærme
  (function () {
    const bgs = document.querySelectorAll('.dk-bg'); if (!bgs.length) return;
    const r = 975 / 993;
    function fit() {
      bgs.forEach(bg => {
        const sec = bg.parentElement, W = sec.clientWidth, H = sec.clientHeight, wide = W > 900;
        const maxW = wide ? W * .52 : W * .94, maxH = H * (wide ? .88 : .6);
        const h = Math.max(220, Math.min(maxH, maxW * r)), w = h / r;
        bg.style.height = h.toFixed(0) + 'px'; bg.style.width = w.toFixed(0) + 'px';
        bg.style.top = wide ? '50%' : (H * .52).toFixed(0) + 'px';
        bg.style.right = 'auto'; bg.style.left = (wide ? W - w - W * .03 : (W - w) / 2).toFixed(0) + 'px';
        bg.style.transform = 'translateY(-50%)';
      });
    }
    fit(); addEventListener('resize', fit); addEventListener('load', fit);
    if ('ResizeObserver' in window) bgs.forEach(bg => new ResizeObserver(fit).observe(bg.parentElement));
  })();

  // menu-drop: tre streger yderst til højre åbner en dropdown (computer). Mobil bruger den fulde menu.
  (function () {
    const mb = document.getElementById('menuBtn'), drop = document.getElementById('menuDrop'); if (!mb || !drop) return;
    const desk = window.matchMedia('(min-width:821px)');
    function set(v) {
      drop.classList.toggle('open', v); mb.classList.toggle('open', v); document.body.classList.toggle('drop-open', v);
      mb.setAttribute('aria-expanded', String(v)); drop.setAttribute('aria-hidden', String(!v));
    }
    mb.addEventListener('click', () => { if (desk.matches) set(!drop.classList.contains('open')); });
    document.addEventListener('click', e => {
      if (!drop.classList.contains('open')) return;
      if (e.target.closest('#menuDrop a')) { set(false); return; }                    // et valg lukker menuen
      if (!e.target.closest('#menuBtn, #menuDrop')) set(false);                         // klik udenfor lukker den
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && drop.classList.contains('open')) { set(false); mb.focus(); } });
    (desk.addEventListener ? desk.addEventListener('change', e => { if (!e.matches) set(false); }) : null);
  })();

  // fm-hop: footerlogoet hopper opad, når man peger på det (kun selve formen reagerer)
  (function () {
    const fm = document.querySelector('a.fmark'); if (!fm || reduce) return;
    fm.addEventListener('pointerenter', () => { if (fm.classList.contains('hop')) return; fm.classList.add('hop'); });
    fm.addEventListener('animationend', () => fm.classList.remove('hop'));
  })();

  // logoet i bunden af footeren: op til toppen af forsiden (på forsiden ruller den blødt op)
  document.addEventListener('click', e => {
    const m = e.target.closest('a.fmark'); if (!m) return;
    const home = /(^|\/)(index\.html)?$/.test(location.pathname);
    if (home) { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
  });

  // mobilmenu → header-farve
  const nav = $('#primaryNav');
  if (nav) new MutationObserver(() => body.classList.toggle('menu-open', nav.classList.contains('open'))).observe(nav, { attributes: true, attributeFilter: ['class'] });

  // scroll: linje + header
  let last = scrollY;
  function onScroll() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    if (heroEl && !managed) {
      const he = heroEl.classList.contains('msp') ? (visMsp() || heroEl) : heroEl;
      // Om os: headeren er gennemsigtig oven på billedet og bliver først en lys bjælke, når personsektionen er forbi
      body.classList.toggle('hdr-solid', he.classList.contains('msp') ? he.getBoundingClientRect().bottom < 140 : y > 80);
    }
    if (y > 420 && y > last + 4) body.classList.add('hdr-hide');
    else if (y < last - 4 || y <= 420) body.classList.remove('hdr-hide');
    last = y;
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // tm-arrive: kommer man fra en anden side via "Om os" (/#team), lander man på "Mød teamet", også mens billeder og skrifter stadig indlæses
  if ($('[data-thru]') && location.hash === '#team' && document.getElementById('team')) {
    let userMoved = false, tries = 0;
    const stop = () => { userMoved = true; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, stop, { passive: true, once: true }));
    const go = () => { if (userMoved) return; const t = document.getElementById('team'); if (t) scrollTo(0, Math.round(t.getBoundingClientRect().top + scrollY)); };
    try { history.scrollRestoration = 'manual'; } catch (err) {}
    go(); const iv = setInterval(() => { go(); if (++tries > 16 || userMoved) clearInterval(iv); }, 250);
    addEventListener('load', () => { go(); setTimeout(go, 500); setTimeout(go, 1500); });
  }

  // tm-jump: på forsiden fører "Om os" ned til "Mød teamet" på samme side (portrætterne fører videre til Om os-siden)
  if ($('[data-thru]') && document.getElementById('team')) {
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href="/om-os"]'); if (!a) return;
      e.preventDefault(); e.stopPropagation();
      if (body.classList.contains('menu-open')) { const mb = document.getElementById('menuBtn'); if (mb) mb.click(); }
      const y = document.getElementById('team').getBoundingClientRect().top + scrollY;
      scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }, true);
  }

  if (reduce) return;
  document.documentElement.classList.add('js');

  // overskrifter: ord for ord
  function split(el) {
    if (el.querySelector('.ln, .w') || el.closest('.overlay')) return;
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
          const wi = document.createElement('span'); wi.className = 'wi'; wi.style.setProperty('--i', i++); wi.textContent = part;
          w.appendChild(wi); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el); el.setAttribute('aria-label', label); el.classList.add('split');
  }
  $$('h1, h2').forEach(split);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= .18) e.target.classList.add('in'); else if (!e.isIntersecting && e.boundingClientRect.top > 0) e.target.classList.remove('in'); }), { threshold: [0, .18] });   // kører baglæns, når man scroller op forbi elementet
    $$('.split').forEach(el => io.observe(el));
  } else $$('.split').forEach(el => el.classList.add('in'));

  if (!fine) return;

  // magnetiske knapper
  $$('.btn, .cta-btn, .cta-btn-outline, .book-btn').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .32).toFixed(1)}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  // 3D-tilt på teamkort
  $$('.tcard').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(1000px) rotateY(${(x * 6).toFixed(2)}deg) rotateX(${(-y * 6).toFixed(2)}deg)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

})();
