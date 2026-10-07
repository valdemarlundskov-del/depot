/* BK Studio — oprydning og effekter (se clean.css).
   - BK-monogrammet bag tal-sektionen og karussellen, der drejer sig mod musen
   - processens tre trin bindes sammen af en streg, der tegner sig ud
   - teamkortene vipper efter musen med en lysrefleks */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $$('.proc').forEach(s => s.classList.add('proc-c'));

  // "Nyopstartet": tallene tæller op fra 0, når de kommer frem (kun én gang)
  function counts() {
    const els = $$('[data-count]'); if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) return;
    els.forEach(el => { el.textContent = '0'; });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 900 + to * 12;
      const step = now => { const k = Math.min(1, (now - t0) / dur), v = 1 - Math.pow(1 - k, 3); el.textContent = String(Math.round(to * v)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    els.forEach(el => io.observe(el));
  }

  // BK-monogrammet: fladen bag tal-sektionen og karussellen (og karussellen på /arbejde) er et diskret mønster af små BK-logoer (som et monogram).
  // Musen er en magnet: logoerne i nærheden drejer sig mod markøren som kompasnåle, vokser og lyser op, og falder blødt
  // tilbage, når den går videre. Tegnes kun, mens noget bevæger sig, og kun når fladen er på skærmen.
  function monogram(wrap, cv) {
    const ctx = cv.getContext('2d'), img = new Image();
    let W = 0, H = 0, dpr = 1, pts = [], spr = null, SZ = 16, vis = false, raf = 0, mx = -1e4, my = -1e4, on = 0, onT = 0;
    function sprite() {
      if (!img.complete || !img.naturalWidth) return;
      const s = Math.ceil(SZ * 3.2 * dpr), c = document.createElement('canvas'); c.width = s; c.height = Math.ceil(s * img.naturalHeight / img.naturalWidth);
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#f7f7f5'; x.fillRect(0, 0, c.width, c.height);
      spr = c;
    }
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 1.5); W = wrap.clientWidth; H = wrap.clientHeight;
      if (H > 1500) dpr = Math.min(dpr, 1.25);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const gap = W < 700 ? 40 : 54; SZ = W < 700 ? 13 : 16; pts = [];
      for (let r = 0, y = gap / 2; y < H + gap; r++, y += gap * .866)                   // forskudte rækker, som et monogram-mønster
        for (let x = (r % 2 ? gap / 2 : 0) + gap / 4; x < W + gap; x += gap) pts.push({ x, y, a: 0, s: 1, o: 0 });
      sprite(); kick();
    }
    function frame() {
      raf = 0; if (!vis || !spr) return;
      on += (onT - on) * .12;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      const R = W < 700 ? 170 : 260, sw = SZ * dpr, sh = sw * spr.height / spr.width;
      let moving = Math.abs(onT - on) > .002;
      for (const p of pts) {
        const dx = mx - p.x, dy = my - p.y, d = Math.hypot(dx, dy), f = reduce ? 0 : on * Math.max(0, 1 - d / R), e = f * f * (3 - 2 * f);
        // vinkel: drej mod markøren (korteste vej), ellers tilbage til 0
        let ta = e > .001 ? Math.atan2(dy, dx) + Math.PI / 2 : 0, da = ta - p.a;
        da = Math.atan2(Math.sin(da), Math.cos(da)); const tA = p.a + da * (e > .001 ? Math.min(1, .25 + e) : 1);
        const na = p.a + (tA - p.a) * .18, ns = p.s + ((1 + 1.6 * e) - p.s) * .16, no = p.o + ((.07 + .6 * e) - p.o) * .16;
        if (Math.abs(na - p.a) > .0005 || Math.abs(ns - p.s) > .0005 || Math.abs(no - p.o) > .0005) moving = true;
        p.a = na; p.s = ns; p.o = no;
        ctx.globalAlpha = p.o; ctx.setTransform(p.s, 0, 0, p.s, p.x * dpr, p.y * dpr); ctx.rotate(p.a);
        ctx.drawImage(spr, -sw / 2, -sh / 2, sw, sh);
      }
      ctx.globalAlpha = 1;
      if (moving) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && vis) raf = requestAnimationFrame(frame); }
    wrap.addEventListener('pointermove', e => { const r = wrap.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; onT = 1; kick(); });
    wrap.addEventListener('pointerleave', () => { onT = 0; kick(); });
    new IntersectionObserver(es => { vis = es[0].isIntersecting; kick(); }, { rootMargin: '100px' }).observe(wrap);
    if ('ResizeObserver' in window) { let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(resize, 120); }).observe(wrap); }
    img.onload = () => { sprite(); kick(); }; img.src = 'images/logo/bk-blob.svg';
    resize();
  }

  function ready() {
    counts(); $$('.mono-field').forEach(cv => monogram(cv.parentElement, cv));   // forsiden og /arbejde
    if (!('IntersectionObserver' in window)) { $$('.proc-rows').forEach(r => r.classList.add('drawn')); return; }

    // processen: stregen tegnes, når trinnene er godt inde på skærmen
    const pio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); pio.unobserve(e.target); } }), { threshold: .35 });
    $$('.proc-c .proc-rows').forEach(r => pio.observe(r));

    // kort, der vipper efter musen
    if (fine && !reduce) {
      $$('.tcard').forEach(card => {
        card.classList.add('tilt');
        let raf = 0, ev = null;
        const max = card.classList.contains('tcard') ? 5 : 8;
        function apply() {
          raf = 0; if (!ev) return;
          const r = card.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          card.style.setProperty('--ry', ((x - .5) * max).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((.5 - y) * max).toFixed(2) + 'deg');
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        }
        card.addEventListener('pointerenter', () => card.classList.add('tilting'));
        card.addEventListener('pointermove', e => { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
        card.addEventListener('pointerleave', () => { ev = null; card.classList.remove('tilting'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
