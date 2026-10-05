/* BK Studio — håndskrift på Om os: teksterne "skrives", mens man scroller.
   Hvert bogstav toner frem i takt med scrollen (og igen ud, når man scroller tilbage). Uden JS eller med "reducer bevægelse" vises teksten bare i skriften. */
(function () {
  'use strict';
  const paras = [...document.querySelectorAll('.msp-body p, .about-bk-copy p:not(.eyebrow)')];
  if (!paras.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const EDGE = 14;                                    // hvor mange bogstaver bag pennen, der stadig er ved at toné frem
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // del hvert afsnit i ord og bogstaver (ordene må ikke brydes midt i)
  function split(p) {
    const chars = [];
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const nodes = []; let n; while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'hw';
        [...part].forEach(ch => { const c = document.createElement('span'); c.className = 'hc'; c.textContent = ch; w.appendChild(c); chars.push(c); });
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    p.classList.add('hand-split');
    return { p, chars, lo: 0, hi: -1, last: -1 };
  }
  const items = paras.map(split);

  function setChar(c, a) {                              // kun lysstyrke: bogstaverne forbliver almindelig tekst, så skriftens sammenhæng mellem bogstaver bevares
    c.style.opacity = a >= 1 ? '' : (a <= 0 ? '0' : a.toFixed(3));
  }
  function paint(it, f) {                              // f = hvor langt pennen er nået (i bogstaver)
    const N = it.chars.length;
    const lo = clamp(Math.floor(f - EDGE) - 1, 0, N - 1), hi = clamp(Math.ceil(f) + 1, 0, N - 1);
    const from = it.hi < 0 ? 0 : Math.min(it.lo, lo), to = it.hi < 0 ? N - 1 : Math.max(it.hi, hi);
    for (let i = from; i <= to; i++) setChar(it.chars[i], clamp((f - i) / EDGE));
    it.lo = lo; it.hi = hi;
  }
  // Før man har scrollet, vises ingen tekst: afsnit, der står på skærmen ved indlæsning, begynder først at blive skrevet, når man scroller.
  // Det gøres ved at trække afsnittets startposition fra ("p0"). Afsnit uden for skærmen følger deres normale position.
  let touched = false;
  const rawP = it => { const vh = innerHeight, r = it.p.getBoundingClientRect(); return { p: clamp((vh * .9 - r.top) / (vh * .32 + r.height)), vis: r.bottom > 0 && r.top < vh }; };
  function baseline() { items.forEach(it => { const r = rawP(it); it.p0 = r.vis ? r.p : 0; it.last = -1; it.hi = -1; }); }
  ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, () => { touched = true; }, { passive: true, once: true }));
  function update() {
    for (const it of items) {
      const N = it.chars.length;
      let p = rawP(it).p;
      if (it.p0 > 0) p = clamp((p - it.p0) / Math.max(.25, 1 - it.p0));
      const f = p * (N + EDGE);
      if (Math.abs(f - it.last) < .01) continue;
      it.last = f; paint(it, f);
    }
  }
  let ticking = false;
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
  addEventListener('scroll', req, { passive: true });
  const rebase = () => { if (!touched) baseline(); req(); };
  addEventListener('resize', rebase);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebase);
  addEventListener('load', rebase);
  setTimeout(rebase, 400); setTimeout(rebase, 1200);
  baseline();
  update();
})();
