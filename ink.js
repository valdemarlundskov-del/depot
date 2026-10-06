/* BK Studio — blæk.
   1) Malingsklatter: på de mørke flader ("Vi skaber billeder…" og "Har du noget, der skal skabes?") efterlader musen et spor af maling,
      der tørrer ud igen efter nogle sekunder. Et klik/tryk giver en stor klat. Afløser højdekurverne (initFlow i v2.js).
   2) Proces: en håndtegnet blækstreg, der starter dér, hvor den øverste linje står, og løber frem og tilbage hen over rækkerne,
      mens man scroller. Undervejs drypper den blækklatter.
   Klatterne tegnes her i koden (ingen billedfiler), og hver klat er tilfældig. */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const TAU = Math.PI * 2;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
  const R = rng(Date.now() % 1e9);

  // ---------- klatter ----------
  // en organisk dråbe: en cirkel med bløde buler
  function blob(cx, cy, r, rnd, n) {
    n = n || 16;
    const k1 = rnd() * TAU, k2 = rnd() * TAU, a1 = .1 + rnd() * .14, a2 = .05 + rnd() * .08, f1 = 2 + ((rnd() * 3) | 0), f2 = 5 + ((rnd() * 4) | 0), pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / n * TAU, rr = r * (1 + a1 * Math.sin(f1 * t + k1) + a2 * Math.sin(f2 * t + k2) + (rnd() - .5) * .07);
      pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]);
    }
    return pts;
  }
  // en sprøjtet stråle: spids inde ved klatten, rund dråbe yderst
  function spike(cx, cy, ang, d0, d1, w, rnd) {
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux, pts = [];
    const bx = cx + ux * d1, by = cy + uy * d1;
    pts.push([cx + ux * d0 - nx * w * .25, cy + uy * d0 - ny * w * .25]);
    for (let i = 0; i <= 10; i++) { const t = -Math.PI / 2 + i / 10 * Math.PI, rr = w * (1 + (rnd() - .5) * .15); pts.push([bx + Math.cos(ang + t) * rr, by + Math.sin(ang + t) * rr]); }
    pts.push([cx + ux * d0 + nx * w * .25, cy + uy * d0 + ny * w * .25]);
    return pts;
  }
  // en hel klat: hovedklat, stråler og små dråber omkring. dir = bevægelsesretning (dråberne flyver mest den vej)
  function splat(x, y, size, dir, rnd, opt) {
    opt = opt || {};
    const shapes = [blob(x, y, size, rnd, 22)];
    const aim = () => (dir == null ? rnd() * TAU : dir + (rnd() - .5) * 2.2);
    const nSp = opt.spikes != null ? opt.spikes : 2 + ((rnd() * 4) | 0);
    for (let i = 0; i < nSp; i++) { const a = aim(); shapes.push(spike(x, y, a, size * .5, size * (1.35 + rnd() * 1.3), size * (.1 + rnd() * .14), rnd)); }
    const nDr = opt.drops != null ? opt.drops : 5 + ((rnd() * 9) | 0);
    for (let i = 0; i < nDr; i++) { const a = aim(), d = size * (1.4 + rnd() * 2.8); shapes.push(blob(x + Math.cos(a) * d, y + Math.sin(a) * d, size * (.05 + rnd() * .2), rnd, 10)); }
    return shapes;
  }
  function trace(ctx, pts) {                                                  // blød lukket kurve gennem punkterne
    const n = pts.length; let p = pts[n - 1], q = pts[0];
    ctx.moveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    for (let i = 0; i < n; i++) { p = pts[i]; q = pts[(i + 1) % n]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    ctx.closePath();
  }
  function svgD(shapes) {
    let d = '';
    shapes.forEach(pts => {
      const n = pts.length, f = v => v.toFixed(1); let p = pts[n - 1], q = pts[0];
      d += 'M' + f((p[0] + q[0]) / 2) + ' ' + f((p[1] + q[1]) / 2);
      for (let i = 0; i < n; i++) { p = pts[i]; q = pts[(i + 1) % n]; d += 'Q' + f(p[0]) + ' ' + f(p[1]) + ' ' + f((p[0] + q[0]) / 2) + ' ' + f((p[1] + q[1]) / 2); }
      d += 'Z';
    });
    return d;
  }

  // ---------- 1) malingsspor efter musen ----------
  function paintTrail(sec, cv) {
    if (!sec || !cv) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, vis = false, raf = 0, ambient = [];
    const live = [], LIFE = 5200, FADE = 2200, MAX = 240;
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = sec.clientWidth; H = sec.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      // faste, svage klatter som baggrund (samme hver gang for sektionen)
      const rs = rng(sec.className.length * 7919 + 13), S = Math.min(W, 1400);
      ambient = [[.12, .2, .09], [.86, .3, .07], [.7, .85, .1], [.24, .8, .05], [.5, .06, .04]].map(a => splat(a[0] * W, a[1] * H, a[2] * S, null, rs, { drops: 9 }));
      kick();
    }
    function add(x, y, size, dir, opt) { live.push({ x, y, s: splat(x, y, size, dir, R, opt), t: performance.now() }); if (live.length > MAX) live.splice(0, live.length - MAX); kick(); }
    function draw(now) {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(247,247,245,.06)'; ctx.beginPath(); ambient.forEach(sh => sh.forEach(p => trace(ctx, p))); ctx.fill();
      for (let i = live.length - 1; i >= 0; i--) {
        const k = live[i], age = now - k.t;
        if (age > LIFE) { live.splice(i, 1); continue; }
        const grow = reduce ? 1 : 1 - Math.pow(1 - clamp(age / 160), 3), a = .9 * (1 - clamp((age - (LIFE - FADE)) / FADE));
        ctx.save(); ctx.translate(k.x, k.y); ctx.scale(grow, grow); ctx.translate(-k.x, -k.y);
        ctx.fillStyle = 'rgba(247,247,245,' + a.toFixed(3) + ')'; ctx.beginPath(); k.s.forEach(p => trace(ctx, p)); ctx.fill(); ctx.restore();
      }
      if (live.length && vis) kick();
    }
    function kick() { if (!raf) raf = requestAnimationFrame(draw); }
    let lx = null, ly = null, lt = 0, acc = 0, big = 200;
    sec.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = sec.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
      if (lx === null) { lx = x; ly = y; lt = now; return; }
      const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy), v = d / Math.max(8, now - lt);         // fart i px/ms
      acc += d; big -= d;
      const dir = Math.atan2(dy, dx);
      if (acc > 26) { acc = 0; add(x, y, 2 + R() * 3.5 + Math.min(v, 2) * 1.5, dir, { spikes: 0, drops: (R() * 3) | 0 }); }
      if (big < 0) { big = 260 + R() * 320; add(x, y, 9 + R() * 12 + Math.min(v, 3) * 4, dir); }
      lx = x; ly = y; lt = now;
    });
    sec.addEventListener('pointerleave', () => { lx = null; });
    sec.addEventListener('pointerdown', e => {
      if (e.target.closest('a,button,input,textarea,label')) return;
      const r = sec.getBoundingClientRect(); add(e.clientX - r.left, e.clientY - r.top, 16 + R() * 14, null, { drops: 12 + ((R() * 8) | 0) });
    });
    let shown = false;
    new IntersectionObserver(es => {
      vis = es[0].isIntersecting; if (vis) kick();
      if (vis && !fine && !shown && !reduce) { shown = true; [0, 380, 820].forEach((t, i) => setTimeout(() => add(W * (.2 + R() * .6), H * (.2 + i * .25), 12 + R() * 12, null), t)); }   // touch: et par klatter, når fladen kommer frem
    }, { rootMargin: '60px' }).observe(sec);
    addEventListener('resize', resize);
    resize();
  }
  document.querySelectorAll('.w3d').forEach(s => paintTrail(s, s.querySelector('.w3d-flow')));
  document.querySelectorAll('.cta-big').forEach(s => paintTrail(s, s.querySelector('.cta-flow')));

  // ---------- 2) Proces: håndtegnet streg med blækklatter ----------
  const proc = document.querySelector('.proc'), rowsEl = proc && proc.querySelector('.proc-rows');
  if (rowsEl && rowsEl.querySelector('.pr')) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ink-line'); svg.setAttribute('aria-hidden', 'true');
    const line = document.createElementNS(NS, 'path'); line.setAttribute('class', 'ink-stroke');
    const tip = document.createElementNS(NS, 'circle'); tip.setAttribute('class', 'ink-tip'); tip.setAttribute('r', '4');
    svg.appendChild(line); svg.appendChild(tip); rowsEl.appendChild(svg);
    let L = 1, blots = [], pad = 40;
    function build() {
      const rs = rng(4242), items = [...rowsEl.querySelectorAll('.pr')], W = rowsEl.clientWidth, H = rowsEl.offsetHeight;
      const gut = rowsEl.getBoundingClientRect().left, bulge = clamp(gut * .55, 10, 44);
      pad = bulge + 30;
      svg.setAttribute('width', W + pad * 2); svg.setAttribute('height', H + pad * 2); svg.setAttribute('viewBox', (-pad) + ' ' + (-pad) + ' ' + (W + pad * 2) + ' ' + (H + pad * 2));
      svg.style.left = -pad + 'px'; svg.style.top = -pad + 'px';
      const ys = items.map(it => it.offsetTop).concat([H - 1]);
      const pts = [], marks = [];
      const amp = 2.2, ph = rs() * 9;
      for (let i = 0; i < ys.length; i++) {
        const y = ys[i], ltr = i % 2 === 0, step = 16, n = Math.max(2, Math.round(W / step));
        for (let k = 0; k <= n; k++) {                                                      // vandret: let rystende hånd
          const u = k / n, x = ltr ? u * W : (1 - u) * W;
          pts.push([x, y + Math.sin(x * .013 + ph + i) * amp + Math.sin(x * .041 + i * 3) * amp * .5 + (rs() - .5) * .9]);
        }
        if (i === ys.length - 1) break;
        // svinget ned til næste linje: en bue ud i margenen med en lille løkke midtvejs
        const y2 = ys[i + 1], side = ltr ? 1 : -1, ex = ltr ? W : 0, m = 26;
        for (let k = 1; k < m; k++) {
          const u = k / m, b = 1 - u;
          let x = b * b * b * ex + 3 * b * b * u * (ex + side * bulge * 1.7) + 3 * b * u * u * (ex + side * bulge * 1.7) + u * u * u * ex;
          let yy = b * b * b * y + 3 * b * b * u * (y + (y2 - y) * .05) + 3 * b * u * u * (y2 - (y2 - y) * .05) + u * u * u * y2;
          const w = clamp((u - .38) / .24);                                                   // løkken
          if (w > 0 && w < 1) { const lr = Math.min(16, (y2 - y) * .1, bulge * .6); x += side * lr * Math.sin(w * TAU); yy += -lr * (1 - Math.cos(w * TAU)) * .9; }
          pts.push([x, yy]);
          if (k === Math.round(m * .5)) marks.push(pts.length - 1);
        }
      }
      // en lille afslutning og en sidste klat
      const last = pts[pts.length - 1], dirEnd = (ys.length - 1) % 2 === 0 ? 1 : -1;
      for (let k = 1; k <= 8; k++) pts.push([last[0] + dirEnd * k * 4, last[1] - Math.sin(k / 8 * Math.PI) * 10 - k * 1.2]);
      marks.push(pts.length - 1);
      // tilfældige drypp undervejs
      for (let k = 0; k < 5; k++) marks.push(Math.floor(pts.length * (.1 + k * .17 + rs() * .08)));
      // glat kurve gennem punkterne + længde målt langs punkterne (til klatternes placering)
      let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1), cum = [0];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i];
        d += 'Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + ((p[0] + q[0]) / 2).toFixed(1) + ' ' + ((p[1] + q[1]) / 2).toFixed(1);
        cum.push(cum[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1]));
      }
      d += 'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + pts[pts.length - 1][1].toFixed(1);
      line.setAttribute('d', d);
      L = line.getTotalLength() || 1;
      line.style.strokeDasharray = L + ' ' + L;
      blots.forEach(b => b.el.remove()); blots = [];
      const total = cum[cum.length - 1] || 1;
      [...new Set(marks)].sort((a, b) => a - b).forEach((ix, j) => {
        const p = pts[Math.min(ix, pts.length - 1)], big = j % 3 === 0 || ix === pts.length - 1, size = big ? 7 + rs() * 6 : 3 + rs() * 3.5;
        const g = document.createElementNS(NS, 'path'); g.setAttribute('class', 'ink-blot');
        g.setAttribute('d', svgD(splat(p[0] + (rs() - .5) * 6, p[1] + (rs() - .5) * 6, size, null, rs, big ? {} : { spikes: (rs() * 2) | 0, drops: 2 + ((rs() * 4) | 0) })));
        g.style.transformOrigin = p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px';
        svg.insertBefore(g, tip); blots.push({ el: g, f: cum[Math.min(ix, cum.length - 1)] / total });
      });
      update();
    }
    function update() {
      const r = rowsEl.getBoundingClientRect(), vh = innerHeight;
      const p = reduce ? 1 : clamp((vh * .82 - r.top) / (r.height + vh * .12));
      line.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
      blots.forEach(b => b.el.classList.toggle('on', p >= b.f));
      if (p > 0 && p < 1) { const q = line.getPointAtLength(L * p); tip.setAttribute('cx', q.x.toFixed(1)); tip.setAttribute('cy', q.y.toFixed(1)); tip.style.opacity = 1; }
      else tip.style.opacity = 0;
    }
    proc.classList.add('ink-on');
    let q = false;
    addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; update(); }); } }, { passive: true });
    let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(build, 120); }).observe(rowsEl);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    build();
  }
})();
