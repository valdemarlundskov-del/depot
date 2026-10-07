/* BK Studio — små magiske detaljer i BK's eget sprog:
   1) markøren er en lille BK-klat, der skifter farve efter baggrunden (som logoet) og vokser over links og billeder; et klik efterlader et kort blækstænk
   2) håndtegnede streger (understregning / cirkel) tegner sig selv om det sidste ord i udvalgte overskrifter
   3) billedbåndet er en filmstrimmel, hvor ét billede ringes ind som på et kontaktark
   4) mørkekammer: billederne i filmstrimlen og projekterne på Arbejde vises først som negativer og fremkaldes, når de kommer ind på skærmen
   5) blæk: på de sort-hvide portrætter breder farven sig i en BK-klat ud fra musen
   Alt er pynt (ingen indhold afhænger af det) og slås fra ved "reducer bevægelse". Markøren bruges kun med mus. */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMGP = p => (window.IMG ? window.IMG(p) : p);
  const NS = 'http://www.w3.org/2000/svg';
  let seed = 7; const rnd = (a, b) => { seed = (seed * 9301 + 49297) % 233280; return a + (seed / 233280) * (b - a); };   // samme "håndbevægelse" hver gang

  // ---------- håndtegnede former ----------
  function underlinePath(w, h) {
    const y = h * .38;
    return `M ${-w * .02} ${y + rnd(-1, 1)} C ${w * .28} ${y - rnd(3, 6)}, ${w * .66} ${y + rnd(3, 6)}, ${w * 1.03} ${y - rnd(1, 3)}` +
           ` M ${w * .1} ${y + h * .34} C ${w * .38} ${y + h * .2}, ${w * .7} ${y + h * .4}, ${w * .93} ${y + h * .24}`;
  }
  function circlePath(w, h) {
    const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2, n = 40, start = rnd(-2.3, -1.9), turns = 1.1, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = start + i / n * turns * Math.PI * 2, k = 1 + Math.sin(i * 1.3) * .02 + i / n * .05;
      pts.push((cx + Math.cos(t) * rx * k).toFixed(1) + ' ' + (cy + Math.sin(t) * ry * k).toFixed(1));
    }
    return 'M ' + pts.join(' L ');
  }
  function drawSvg(host, kind, box, strokeW) {
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'bk-mark bk-mark-' + kind); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', `0 0 ${box.w.toFixed(1)} ${box.h.toFixed(1)}`);
    Object.assign(svg.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' });
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', kind === 'circle' ? circlePath(box.w, box.h) : underlinePath(box.w, box.h));
    p.setAttribute('stroke-width', strokeW.toFixed(2)); svg.appendChild(p); host.appendChild(svg);
    const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = reduce ? 0 : L;
    return svg;
  }

  // ---------- 2) streger om det sidste ord i overskrifter ----------
  const heads = [...document.querySelectorAll('[data-mark]')];
  function markHeading(h) {
    h.querySelectorAll(':scope > .bk-mark').forEach(s => s.remove());
    const words = [...h.querySelectorAll('.w')]; let last = words[words.length - 1];
    if (!last) {                                                       // overskriften er ikke delt i ord: pak det sidste ord ind
      const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let n, lt = null; while ((n = tw.nextNode())) if (n.nodeValue.trim()) lt = n;
      if (!lt) return; const m = lt.nodeValue.match(/(\S+)\s*$/); if (!m) return;
      const span = document.createElement('span'); span.className = 'bk-lastw'; const rest = lt.splitText(m.index); rest.nodeValue = m[1]; rest.parentNode.replaceChild(span, rest); span.appendChild(document.createTextNode(m[1])); last = span;
    }
    const hr = h.getBoundingClientRect(), wr = last.getBoundingClientRect(), fs = parseFloat(getComputedStyle(h).fontSize), kind = h.dataset.mark;
    if (!wr.width) return;
    const box = kind === 'circle'
      ? { x: wr.left - hr.left - fs * .26, y: wr.top - hr.top - fs * .16, w: wr.width + fs * .52, h: wr.height + fs * .3 }
      : { x: wr.left - hr.left - fs * .04, y: wr.bottom - hr.top - fs * .2, w: wr.width + fs * .08, h: fs * .36 };
    const svg = drawSvg(h, kind, box, Math.max(2.2, fs * (kind === 'circle' ? .035 : .045)));
    if (h.__drawn) svg.classList.add('drawn');
  }
  if (heads.length) {
    heads.forEach(h => { if (getComputedStyle(h).position === 'static') h.style.position = 'relative'; });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || e.target.__drawn) return;
      e.target.__drawn = true; io.unobserve(e.target);
      setTimeout(() => e.target.querySelectorAll(':scope > .bk-mark').forEach(s => s.classList.add('drawn')), reduce ? 0 : 900);
    }), { threshold: .55 });
    const all = () => heads.forEach(markHeading);
    const start = () => { all(); heads.forEach(h => io.observe(h)); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(start, 250));
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(all, 200); });
  }

  // ---------- 3) filmstrimlen: ét billede ringes ind (som på et kontaktark) ----------
  const frames = [...document.querySelectorAll('.strip-track > div')];
  if (frames.length > 4) {
    const f = frames[3]; f.classList.add('picked');
    const box = { x: -f.offsetWidth * .08, y: -f.offsetHeight * .08, w: f.offsetWidth * 1.16, h: f.offsetHeight * 1.16 };
    const make = () => { f.querySelectorAll('.bk-mark').forEach(s => s.remove()); const s = drawSvg(f, 'circle', { x: -f.offsetWidth * .08, y: -f.offsetHeight * .08, w: f.offsetWidth * 1.16, h: f.offsetHeight * 1.16 }, Math.max(3, f.offsetHeight * .012)); if (f.__drawn) s.classList.add('drawn'); };
    const img = f.querySelector('img'); if (img && !img.complete) img.addEventListener('load', make, { once: true }); make();
    const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !f.__drawn) { f.__drawn = true; setTimeout(() => f.querySelectorAll('.bk-mark').forEach(s => s.classList.add('drawn')), reduce ? 0 : 500); io2.disconnect(); } }), { threshold: .25 });
    io2.observe(f);
    let t2; addEventListener('resize', () => { clearTimeout(t2); t2 = setTimeout(make, 200); });
    void box;
  }

  // ---------- 4) mørkekammer: negativ → fremkaldt billede ----------
  // Negativet bygges oven på billedets egen filter-liste med samme funktioner i begge tilstande, så browseren kan tone glat mellem dem.
  if (!reduce && 'IntersectionObserver' in window) {
    const devs = [...document.querySelectorAll('.strip-track > div, #workGrid .work-item')];
    const NEG = 'invert(1) hue-rotate(180deg) sepia(.6) saturate(1.45) brightness(1.04)', POS = 'invert(0) hue-rotate(0deg) sepia(0) saturate(1) brightness(1)';
    devs.forEach(el => { const im = el.querySelector('img'); if (!im) return; const base = getComputedStyle(im).filter; el.__base = base === 'none' ? '' : ' ' + base; im.style.filter = NEG + el.__base; });
    const io3 = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; const el = e.target, im = el.querySelector('img'); io3.unobserve(el); if (!im) return;
      setTimeout(() => {
        im.style.transition = 'filter 2.2s cubic-bezier(.33,.1,.25,1)'; im.style.filter = POS + el.__base;
        setTimeout(() => { im.style.transition = ''; im.style.filter = ''; }, 2400);                   // tilbage til billedets egne regler (samme udseende)
      }, 120 + Math.round(rnd(0, 320)));
    }), { threshold: .3 });
    devs.forEach(el => io3.observe(el));
  }

  // ---------- 1) BK-klatten som markør (kun mus, ikke ved "reducer bevægelse") ----------
  if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const cur = document.createElement('div'); cur.className = 'bk-cur'; cur.setAttribute('aria-hidden', 'true');
  const ci = document.createElement('img'); ci.src = IMGP('images/logo/bk-blob.svg'); ci.alt = ''; cur.appendChild(ci); document.body.appendChild(cur);
  let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
  const tick = () => { x += (tx - x) * .22; y += (ty - y) * .22; cur.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; raf = (Math.abs(tx - x) + Math.abs(ty - y) > .3) ? requestAnimationFrame(tick) : 0; };
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; if (!cur.classList.contains('on')) { x = tx; y = ty; cur.classList.add('on'); } if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => cur.classList.remove('on'));
  const MEDIA = 'img,video,canvas.thru-canvas,.w3c,.tcard,.work-item,.mh-p,.strip-track > div,.ak-cell,.ak-tile,.lb-fig';
  const LINK = 'a,button,[role="button"],input,textarea,select,label,summary';
  addEventListener('mouseover', e => { const t = e.target, media = !!t.closest(MEDIA); cur.classList.toggle('media', media); cur.classList.toggle('link', !media && !!t.closest(LINK)); }, { passive: true });   // billeder vinder over links (et portræt er også et link)
  addEventListener('pointerdown', e => {                                // et klik efterlader et kort blækstænk
    if (e.pointerType !== 'mouse') return;
    const s = document.createElement('div'); s.className = 'bk-ink'; s.setAttribute('aria-hidden', 'true');
    s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.style.setProperty('--r', (rnd(-40, 40)).toFixed(0) + 'deg');
    const im = document.createElement('img'); im.src = ci.src; im.alt = ''; s.appendChild(im); document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }, { passive: true });

  // ---------- 5) blæk: farven breder sig i en BK-klat fra musen (portrætterne på forsiden og Om os) ----------
  const blobURL = 'url("' + IMGP('images/logo/bk-blob.svg') + '")';
  document.querySelectorAll('.tm-img, .mh-img').forEach(host => {
    const img = host.querySelector('img'); if (!img) return;
    const mv = document.createElement('span'); mv.className = 'ink-mv'; host.insertBefore(mv, img); mv.appendChild(img);   // bevægelsen (parallakse) flyttes til en fælles ramme, så farvelaget følger præcist med
    const col = img.cloneNode(); col.className = 'ink-col'; col.alt = ''; col.removeAttribute('loading'); col.setAttribute('aria-hidden', 'true');
    col.style.webkitMaskImage = blobURL; col.style.maskImage = blobURL; mv.appendChild(col); host.classList.add('ink-ready');
    let ms = 0, target = 0, mx = 0, my = 0, raf = 0;
    const set = () => { const v = ms.toFixed(1) + 'px auto', p = (mx - ms / 2).toFixed(1) + 'px ' + (my - ms * .43).toFixed(1) + 'px'; col.style.webkitMaskSize = v; col.style.maskSize = v; col.style.webkitMaskPosition = p; col.style.maskPosition = p; };
    const step = () => { ms += (target - ms) * (target > ms ? .045 : .08); set(); if (Math.abs(target - ms) > .5) raf = requestAnimationFrame(step); else { ms = target; set(); raf = 0; } };
    const pos = e => { const r = col.getBoundingClientRect(), k = col.offsetWidth / (r.width || 1); mx = (e.clientX - r.left) * k; my = (e.clientY - r.top) * k; };
    host.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; pos(e); target = Math.hypot(col.offsetWidth, col.offsetHeight) * 2.6; if (!raf) raf = requestAnimationFrame(step); });
    host.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; pos(e); if (!raf) set(); });
    host.addEventListener('pointerleave', () => { target = 0; if (!raf) raf = requestAnimationFrame(step); });
    set();
  });
})();
