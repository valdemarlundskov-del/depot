/* BK Studio — Om os: beskrivelserne "skrives", mens man scroller.
   Teksten skrives som én fortløbende strøm pr. person, ÉN LINJE ad gangen: en linje skal være færdig, før den næste begynder, og et nyt afsnit begynder først, når det forrige er skrevet færdigt.
   Før man har scrollet, vises ingen tekst. Scroller man tilbage, "skrives" teksten ud igen i omvendt rækkefølge. Med "reducer bevægelse" vises teksten bare. */
(function () {
  'use strict';
  const groupsEl = [...[...document.querySelectorAll('.msp-body')].map(b => [...b.querySelectorAll('p')]), [...document.querySelectorAll('.about-bk-copy p:not(.eyebrow)')]].filter(g => g.length);
  if (!groupsEl.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const EDGE = 10;                                    // hvor mange bogstaver, der er ved at toné frem på den linje, der skrives
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
    return chars;
  }
  const groups = groupsEl.map(paras => { const chars = []; paras.forEach(p => chars.push(...split(p))); return { paras, chars, v: null, V: 1, plo: 0, phi: -1, last: -1, s0: 0 }; });

  // "virtuelt" bogstavnummer: hver ny linje (også et nyt afsnit) rykkes EDGE bogstaver frem, så en linje er helt færdig, før den næste begynder
  function layout(g) {
    let L = -1, lastTop = -1e9; const v = new Float32Array(g.chars.length);
    g.chars.forEach((c, i) => { const t = c.getBoundingClientRect().top + scrollY; if (Math.abs(t - lastTop) > 4) { L++; lastTop = t; } v[i] = i + EDGE * L; });
    g.v = v; g.V = (v.length ? v[v.length - 1] : 0) + 1 + EDGE; g.plo = 0; g.phi = -1; g.last = -1;
  }
  const lower = (v, x) => { let a = 0, b = v.length; while (a < b) { const m = (a + b) >> 1; if (v[m] < x) a = m + 1; else b = m; } return a; };   // første indeks med v >= x
  function paint(g, F) {
    const v = g.v, N = v.length; if (!N) return;
    const lo = clamp(lower(v, F - EDGE) - 1, 0, N - 1), hi = clamp(lower(v, F) + 1, 0, N - 1);
    const from = g.phi < 0 ? 0 : Math.min(g.plo, lo), to = g.phi < 0 ? N - 1 : Math.max(g.phi, hi);
    for (let i = from; i <= to; i++) {
      const a = clamp((F - v[i]) / EDGE), c = g.chars[i];
      c.style.opacity = a >= 1 ? '' : (a <= 0 ? '0' : a.toFixed(3));
    }
    g.plo = lo; g.phi = hi;
  }

  // hele afsnitsgruppen skrives, mens den bevæger sig op gennem skærmen: den begynder, når toppen når 90 % ned, og er færdig, når bunden når ca. 56 %
  const isHidden = g => g.paras[0].getClientRects().length === 0;          // sektionen er skjult (kun én persons sektion vises ad gangen)
  const raw = g => {
    const vh = innerHeight, a = g.paras[0].getBoundingClientRect(), z = g.paras[g.paras.length - 1].getBoundingClientRect();
    return { s: clamp((vh * .9 - a.top) / (vh * .34 + (z.bottom - a.top))), vis: z.bottom > 0 && a.top < vh };
  };
  // Før man har scrolløet, vises ingen tekst: en gruppe, der allerede står på skærmen ved indlæsning, begynder først at blive skrevet, når man scroller.
  let touched = false;
  function baseline() { groups.forEach(g => { layout(g); g.hidden = isHidden(g); const r = g.hidden ? { vis: false, s: 0 } : raw(g); g.s0 = r.vis ? r.s : 0; }); }
  ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, () => { touched = true; }, { passive: true, once: true }));
  function update() {
    for (const g of groups) {
      if (isHidden(g)) { g.hidden = true; if (g.last !== 0) { g.last = 0; paint(g, 0); } continue; }       // skjult: teksten holdes tom
      if (g.hidden) { g.hidden = false; layout(g); const r = raw(g); g.s0 = r.vis ? r.s : 0; }              // netop blevet synlig (fx skift til den anden person): start forfra
      let s = raw(g).s;
      if (g.s0 > 0) s = clamp((s - g.s0) / Math.max(.25, 1 - g.s0));
      const F = s * g.V;
      if (Math.abs(F - g.last) < .01) continue;
      g.last = F; paint(g, F);
    }
  }
  let ticking = false;
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
  addEventListener('scroll', req, { passive: true });
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(req); groups.forEach(g => ro.observe(g.paras[0])); }
  const rebase = () => { if (!touched) baseline(); else groups.forEach(layout); req(); };       // linjerne regnes om, når skrift eller vindue ændrer sig
  addEventListener('resize', rebase);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebase);
  addEventListener('load', rebase);
  setTimeout(rebase, 400); setTimeout(rebase, 1200);
  baseline(); update();
})();
