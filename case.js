// BK Studio — projektsiden: skiftende hero, fælles overskrift der glider ned mod nederste venstre hjørne,
// dynamisk billedopstilling med parallax og tekster der glider ind fra siderne. Bruger #overlay fra /arbejde.
(function () {
  const ov = document.getElementById('overlay');
  if (!ov) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  let running = false, raf = 0, timer = 0, io = null, lastTop = -1, dirty = true;
  let hero, slides, title, cat, count, hint, imgs = [], bands = [];

  function fit() {
    const vw = ov.clientWidth, gut = Math.min(vw * .055, 84);
    title.style.fontSize = '100px';
    const w = title.scrollWidth || 1;
    title.style.fontSize = Math.min(vh() * .34, 100 * (vw - 2 * gut) / w * .99) + 'px';
    // den lille tekst placeres over titlens faktiske højde med god luft imellem (titlens skriftstørrelse er tilpasset bredden)
    if (cat) { const fs = parseFloat(title.style.fontSize) || 100; cat.style.bottom = 'calc(' + (vh() < 700 ? 9 : 11) + 'vh + ' + (fs * 1.0 + Math.max(30, Math.min(vw * .046, 76))).toFixed(1) + 'px)'; }
  }
  const vh = () => ov.clientHeight;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    const st = ov.scrollTop;
    if (st === lastTop && !dirty) return;
    lastTop = st; dirty = false;
    const H = vh(), W = ov.clientWidth;
    // hero: zoom ind, og overskriften glider ned mod nederste venstre hjørne
    const range = Math.max(1, hero.offsetHeight - H);
    const q = reduce ? 0 : clamp(st / range);
    slides.style.transform = 'scale(' + (1 + q * .45).toFixed(4) + ')';
    const s = 1 - .84 * smooth(q * 1.02), ty = smooth(q) * H * .085;
    title.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
    const fo = 1 - clamp(q * 3);
    cat.style.opacity = fo; count.style.opacity = fo; hint.style.opacity = fo;
    if (reduce) return;
    // billeder: parallax
    for (const el of imgs) {
      const r = el.getBoundingClientRect(); if (r.bottom < -80 || r.top > H + 80) continue;
      const c = (r.top + r.height / 2) / H;
      el.style.setProperty('--py', ((.5 - c) * r.height * .14).toFixed(1) + 'px');
    }
    // tekstbånd: glider hen over skærmen i takt med scroll, skiftevis fra venstre og højre
    for (const b of bands) {
      const r = b.getBoundingClientRect(); if (r.bottom < -80 || r.top > H + 80) continue;
      const tr = b.firstElementChild, over = Math.max(0, tr.scrollWidth - W);
      const c = (r.top + r.height / 2) / H, t = clamp((1.1 - c) / 1.2), dir = +b.dataset.dir;
      tr.style.transform = 'translate3d(' + (-(dir > 0 ? t : 1 - t) * over).toFixed(1) + 'px,0,0)';
    }
  }

  function start() {
    hero = document.getElementById('csHero'); slides = document.getElementById('csSlides');
    title = document.getElementById('ovTitle'); cat = document.getElementById('ovCat'); count = document.getElementById('ovCount'); hint = ov.querySelector('.cs-scroll');
    imgs = [...ov.querySelectorAll('.cf-img')]; bands = [...ov.querySelectorAll('.cf-band')];
    if (!hero || !slides || !title) return;
    fit(); lastTop = -1; dirty = true; running = true;
    // skiftende hero-billeder
    clearInterval(timer);
    const sl = [...slides.children]; let k = 0;
    if (sl.length > 1 && !reduce) timer = setInterval(() => { sl[k].classList.remove('on'); k = (k + 1) % sl.length; sl[k].classList.add('on'); }, 3600);
    // tekster og billeder der glider ind, når de kommer til syne
    if (io) io.disconnect();
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= .14) e.target.classList.add('in'); else if (!e.isIntersecting && e.boundingClientRect.top > (e.rootBounds ? e.rootBounds.top : 0)) e.target.classList.remove('in'); }), { root: ov, threshold: [0, .14] });
      ov.querySelectorAll('.cf-img, .cf-word, .ov-info p, .ov-meta div, .ov-cta h3').forEach(el => { el.classList.add('cs-rv'); io.observe(el); });
    } else ov.querySelectorAll('.cs-rv').forEach(el => el.classList.add('in'));
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; clearInterval(timer); cancelAnimationFrame(raf); if (io) io.disconnect(); }

  new MutationObserver(() => { if (ov.classList.contains('open')) start(); else stop(); }).observe(ov, { attributes: true, attributeFilter: ['class'] });
  ov.addEventListener('projectchange', () => { if (ov.classList.contains('open')) start(); });
  ov.addEventListener('scroll', () => { dirty = true; }, { passive: true });
  addEventListener('resize', () => { if (running) { fit(); dirty = true; } });
})();
