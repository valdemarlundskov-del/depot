/* BK Studio — blæk.
   1) Malingsklatter: på de mørke flader ("Vi skaber billeder…" og "Har du noget, der skal skabes?") efterlader musen et spor af maling,
      der tørrer ud igen efter nogle sekunder. Et klik/tryk giver en stor klat. Afløser højdekurverne (initFlow i v2.js).
   2) Sektionsetiketterne: den lille streg efter "(01) Ydelser", "(02) Proces", "(03) Teamet" og "(04) Kontakt" bliver til en håndtegnet
      blækstreg, der tegner sig ud, når man scroller hen til den. Ved Proces fortsætter stregen ned langs kanten og slår ring om hvert af
      de tre trin, og den drypper blækklatter undervejs.
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
  // alle former vendes samme vej rundt, så de smelter sammen til én flade, når de udfyldes (ellers bliver overlap til huller)
  function orient(pts) {
    let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return a < 0 ? pts.reverse() : pts;
  }
  // en organisk dråbe; stretch/ang trækker den ud i en retning (en dråbe i fart)
  function blob(cx, cy, r, rnd, n, stretch, ang) {
    n = n || 16; stretch = stretch || 1; ang = ang || 0;
    const k1 = rnd() * TAU, k2 = rnd() * TAU, a1 = .08 + rnd() * .14, a2 = .04 + rnd() * .07, f1 = 2 + ((rnd() * 3) | 0), f2 = 5 + ((rnd() * 4) | 0);
    const ca = Math.cos(ang), sa = Math.sin(ang), pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / n * TAU, rr = r * (1 + a1 * Math.sin(f1 * t + k1) + a2 * Math.sin(f2 * t + k2) + (rnd() - .5) * .06);
      let x = Math.cos(t) * rr * stretch; const y = Math.sin(t) * rr;
      if (stretch !== 1 && x > 0) x *= 1 + .25 * (stretch - 1);                         // fronten bliver lidt spidsere end halen
      pts.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
    }
    return orient(pts);
  }
  // en tynd stråle, der smalner ind og ender i en lille kugle
  function tendril(cx, cy, ang, d0, len, w0, bulb, rnd) {
    const L = [], Rt = [], steps = 9, bend = (rnd() - .5) * .35;
    let a = ang, x = cx + Math.cos(ang) * d0, y = cy + Math.sin(ang) * d0;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, w = w0 * Math.pow(1 - t, .7) + bulb * .35 * t, nx = -Math.sin(a), ny = Math.cos(a);
      L.push([x + nx * w, y + ny * w]); Rt.push([x - nx * w, y - ny * w]);
      if (i < steps) { a += bend / steps; x += Math.cos(a) * len / steps; y += Math.sin(a) * len / steps; }
    }
    const end = [x + Math.cos(a) * bulb * .6, y + Math.sin(a) * bulb * .6], cap = [];
    for (let i = 1; i < 10; i++) { const t = a - Math.PI / 2 + i / 10 * Math.PI; cap.push([end[0] + Math.cos(t) * bulb, end[1] + Math.sin(t) * bulb]); }
    return { shape: orient(L.concat(cap, Rt.reverse())), tip: end, ang: a };
  }
  // en hel klat: sammenflydende pøle, stråler med dråbespor og fint sprøjt. dir = bevægelsesretning (det meste flyver den vej)
  function splat(x, y, size, dir, rnd, opt) {
    opt = opt || {};
    const shapes = [], aim = s => (dir == null ? rnd() * TAU : dir + (rnd() - .5) * (s || 2.4));
    shapes.push(blob(x, y, size, rnd, 24, dir == null ? 1 : 1 + rnd() * .5, dir || 0));
    const lobes = opt.lobes != null ? opt.lobes : 1 + ((rnd() * 3) | 0);
    for (let i = 0; i < lobes; i++) { const a = aim(3.4), d = size * (.35 + rnd() * .4); shapes.push(blob(x + Math.cos(a) * d, y + Math.sin(a) * d, size * (.42 + rnd() * .3), rnd, 18)); }
    const nT = opt.tendrils != null ? opt.tendrils : 3 + ((rnd() * 5) | 0);
    for (let i = 0; i < nT; i++) {
      const a = aim(), td = tendril(x, y, a, size * .55, size * (.7 + rnd() * 2.3), size * (.1 + rnd() * .12), size * (.07 + rnd() * .1), rnd);
      shapes.push(td.shape);
      const nd = rnd() < .65 ? 1 + ((rnd() * 3) | 0) : 0;                                 // dråbespor ud for strålen
      for (let k = 1; k <= nd; k++) { const d = size * (.25 + k * (.22 + rnd() * .2)), r = size * (.07 - k * .012 + rnd() * .03); if (r > .3) shapes.push(blob(td.tip[0] + Math.cos(td.ang) * d, td.tip[1] + Math.sin(td.ang) * d, r, rnd, 9, 1.3, td.ang)); }
    }
    const nD = opt.drops != null ? opt.drops : 4 + ((rnd() * 8) | 0);
    for (let i = 0; i < nD; i++) { const a = aim(), d = size * (1.3 + rnd() * 2.4); shapes.push(blob(x + Math.cos(a) * d, y + Math.sin(a) * d, size * (.05 + rnd() * .15), rnd, 10, 1 + rnd() * .6, a)); }
    const nS = opt.spray != null ? opt.spray : 10 + ((rnd() * 26) | 0);                    // fint sprøjt
    for (let i = 0; i < nS; i++) { const a = aim(2.8), d = size * (1.2 + rnd() * 3.6), r = .35 + rnd() * Math.min(1.6, size * .06); shapes.push(blob(x + Math.cos(a) * d, y + Math.sin(a) * d, r, rnd, 6)); }
    return shapes;
  }
  // en lille dråbe i fart (til sporet efter musen): aflang i bevægelsesretningen med lidt sprøjt
  function droplet(x, y, size, dir, rnd) {
    const shapes = [blob(x, y, size, rnd, 14, 1.4 + rnd() * .9, dir)], n = (rnd() * 4) | 0;
    for (let i = 0; i < n; i++) { const a = dir + (rnd() - .5) * 1.4, d = size * (1.6 + rnd() * 2.5); shapes.push(blob(x + Math.cos(a) * d, y + Math.sin(a) * d, .4 + rnd() * size * .25, rnd, 6)); }
    return shapes;
  }
  function trace(ctx, pts) {                                                                 // blød lukket kurve gennem punkterne
    const n = pts.length; let p = pts[n - 1], q = pts[0];
    ctx.moveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    for (let i = 0; i < n; i++) { p = pts[i]; q = pts[(i + 1) % n]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    ctx.closePath();
  }
  function svgD(shapes) {
    let d = ''; const f = v => v.toFixed(1);
    shapes.forEach(pts => {
      const n = pts.length; let p = pts[n - 1], q = pts[0];
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
    const live = [], LIFE = 5600, FADE = 2400, MAX = 260;
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = sec.clientWidth; H = sec.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const rs = rng(sec.className.length * 7919 + 13), S = Math.min(W, 1400);                  // faste, svage klatter som baggrund
      ambient = [[.12, .22, .07], [.88, .3, .055], [.7, .86, .08], [.22, .82, .04], [.5, .08, .035]].map(a => splat(a[0] * W, a[1] * H, a[2] * S, null, rs));
      kick();
    }
    function add(x, y, shapes) { live.push({ x, y, s: shapes, t: performance.now() }); if (live.length > MAX) live.splice(0, live.length - MAX); kick(); }
    function draw(now) {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(247,247,245,.055)'; ctx.beginPath(); ambient.forEach(sh => sh.forEach(p => trace(ctx, p))); ctx.fill();
      for (let i = live.length - 1; i >= 0; i--) {
        const k = live[i], age = now - k.t;
        if (age > LIFE) { live.splice(i, 1); continue; }
        const grow = reduce ? 1 : 1 - Math.pow(1 - clamp(age / 140), 3), a = .92 * (1 - clamp((age - (LIFE - FADE)) / FADE));
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
      const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy), v = d / Math.max(8, now - lt), dir = Math.atan2(dy, dx);   // fart i px/ms
      acc += d; big -= d;
      if (acc > 22) { acc = 0; add(x, y, droplet(x, y, 1.8 + R() * 2.6 + Math.min(v, 2) * 1.2, dir, R)); }
      if (big < 0) { big = 240 + R() * 340; add(x, y, splat(x, y, 9 + R() * 11 + Math.min(v, 3) * 4, dir, R)); }
      lx = x; ly = y; lt = now;
    });
    sec.addEventListener('pointerleave', () => { lx = null; });
    sec.addEventListener('pointerdown', e => {
      if (e.target.closest('a,button,input,textarea,label')) return;
      const r = sec.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      add(x, y, splat(x, y, 18 + R() * 14, null, R, { tendrils: 5 + ((R() * 5) | 0), spray: 30 + ((R() * 20) | 0) }));
    });
    let shown = false;
    new IntersectionObserver(es => {
      vis = es[0].isIntersecting; if (vis) kick();
      if (vis && !fine && !shown && !reduce) {                                                     // touch: et par klatter, når fladen kommer frem
        shown = true;
        [0, 380, 820].forEach((t, i) => setTimeout(() => { const x = W * (.2 + R() * .6), y = H * (.2 + i * .25); add(x, y, splat(x, y, 12 + R() * 12, null, R)); }, t));
      }
    }, { rootMargin: '60px' }).observe(sec);
    addEventListener('resize', resize);
    resize();
  }
  document.querySelectorAll('.w3d').forEach(s => paintTrail(s, s.querySelector('.w3d-flow')));
  document.querySelectorAll('.cta-big').forEach(s => paintTrail(s, s.querySelector('.cta-flow')));

  // ---------- 2) blækstreger fra sektionsetiketterne ----------
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, cls) => { const n = document.createElementNS(NS, tag); if (cls) n.setAttribute('class', cls); return n; };
  // glat kurve gennem punkterne; giver også længden målt langs punkterne og den laveste kant (største y) indtil hvert punkt
  function smooth(pts) {
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1); const cum = [0], ymax = [pts[0][1]];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      d += 'Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + ((p[0] + q[0]) / 2).toFixed(1) + ' ' + ((p[1] + q[1]) / 2).toFixed(1);
      cum.push(cum[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1])); ymax.push(Math.max(ymax[i - 1], q[1]));
    }
    const l = pts[pts.length - 1]; d += 'L' + l[0].toFixed(1) + ' ' + l[1].toFixed(1);
    return { d, cum, ymax };
  }
  // en let rystende vandret linje fra x0 til x1
  function wobbly(x0, x1, y, rs, out) {
    const n = Math.max(2, Math.round(Math.abs(x1 - x0) / 14)), ph = rs() * 9;
    for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n; out.push([x, y + Math.sin(x * .013 + ph) * 1.8 + Math.sin(x * .043 + ph * 2) * .9 + (rs() - .5) * .7]); }
    return out;
  }
  function blotShape(p, size, rs, big) {
    return splat(p[0] + (rs() - .5) * 4, p[1] + (rs() - .5) * 4, size, null, rs, big ? { tendrils: 3 + ((rs() * 4) | 0), spray: 8 + ((rs() * 10) | 0) } : { lobes: 0, tendrils: (rs() * 2) | 0, drops: 1 + ((rs() * 3) | 0), spray: 3 + ((rs() * 5) | 0) });
  }

  // fælles motor: en sti + klatter i en svg. Stregen tegnes frem, efterhånden som en vandret læselinje på skærmen passerer punkterne;
  // pennen indhenter læselinjen blødt, så ringene tegnes og ikke hopper frem. lineY giver læselinjen i svg'ens koordinater.
  function inkPath(host, svg, buildFn, lineY) {
    const line = mk('path', 'ink-stroke'), tip = mk('circle', 'ink-tip'); tip.setAttribute('r', '3.6');
    svg.appendChild(line); svg.appendChild(tip);
    let L = 1, cum = [1], ymax = [0], total = 1, blots = [], cur = 0, target = 0, raf = 0;
    function build() {
      const g = buildFn(); if (!g) return;
      const s = smooth(g.pts); line.setAttribute('d', s.d); cum = s.cum; ymax = s.ymax; total = cum[cum.length - 1] || 1;
      L = line.getTotalLength() || 1; line.style.strokeDasharray = L + ' ' + L;
      blots.forEach(b => b.el.remove()); blots = [];
      g.blots.forEach(b => {
        const el = mk('path', 'ink-blot'); el.setAttribute('d', svgD(b.shapes)); el.style.transformOrigin = b.p[0].toFixed(1) + 'px ' + b.p[1].toFixed(1) + 'px';
        svg.insertBefore(el, tip); blots.push({ el, f: cum[Math.min(b.i, cum.length - 1)] / total });
      });
      update(true);
    }
    function aim() {
      if (reduce) return 1;
      const Y = lineY(); if (ymax[0] > Y) return 0;
      let lo = 0, hi = ymax.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ymax[m] <= Y) lo = m; else hi = m - 1; }
      return cum[lo] / total;
    }
    function paint() {
      line.style.strokeDashoffset = (L * (1 - cur)).toFixed(1);
      blots.forEach(b => b.el.classList.toggle('on', cur >= b.f - .002));
      if (cur > .002 && cur < .998) { const q = line.getPointAtLength(L * cur); tip.setAttribute('cx', q.x.toFixed(1)); tip.setAttribute('cy', q.y.toFixed(1)); tip.style.opacity = 1; } else tip.style.opacity = 0;
    }
    function step() {
      raf = 0; const d = target - cur;
      cur = Math.abs(d) < .002 ? target : cur + d * .08 + Math.sign(d) * .002;
      if ((d > 0 && cur > target) || (d < 0 && cur < target)) cur = target;
      paint(); if (cur !== target) raf = requestAnimationFrame(step);
    }
    function update(now) { target = aim(); if (now === true || reduce) { cur = target; paint(); } else if (!raf) raf = requestAnimationFrame(step); }
    let q = false;
    addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; update(); }); } }, { passive: true });
    let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(build, 120); }).observe(host);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    build();
  }

  const proc = document.querySelector('.proc'), rowsEl = proc && proc.querySelector('.proc-rows');
  document.querySelectorAll('.m-idx').forEach((lab, li) => {
    const rs = rng(1000 + li * 97), txt = lab.lastElementChild; if (!txt) return;
    const isProc = proc && proc.contains(lab) && rowsEl && rowsEl.querySelector('.pr');
    lab.classList.add('ink-on');
    if (!isProc) {
      // almindelig etiket: stregen løber fra etiketten hen til kanten af sektionens indhold, slår en lille krølle og drypper
      const svg = mk('svg', 'ink-line ink-lab'); svg.setAttribute('aria-hidden', 'true'); lab.appendChild(svg);
      const edge = lab.closest('.section-head') || lab.parentElement;
      inkPath(lab, svg, () => {
        const lr = lab.getBoundingClientRect(), x0 = txt.offsetLeft + txt.offsetWidth + 12, y = lab.clientHeight / 2;
        const x1 = Math.max(x0 + 60, Math.min(edge.getBoundingClientRect().right - lr.left - 24, x0 + 900)), W = x1 + 40, H = 70;
        svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 ' + (y - H / 2) + ' ' + W + ' ' + H);
        svg.style.left = '0px'; svg.style.top = (y - H / 2) + 'px';
        const pts = wobbly(x0, x1, y, rs, []);
        for (let k = 1; k <= 10; k++) { const t = k / 10 * TAU * .85; pts.push([x1 + Math.sin(t) * 9 + k * .6, y - (1 - Math.cos(t)) * 7]); }   // lille krølle til sidst
        const end = pts.length - 1, mid = Math.round(end * .55);
        return { pts, blots: [{ p: pts[mid], i: mid, shapes: blotShape(pts[mid], 2 + rs() * 1.5, rs, false) }, { p: pts[end], i: end, shapes: blotShape(pts[end], 4.5 + rs() * 2.5, rs, true) }] };
      }, () => innerHeight * .86 - lab.getBoundingClientRect().top);
      return;
    }
    // Proces: fra etiketten hen til højre kant, ned langs margenen og en ring om hvert trin
    proc.classList.add('ink-on');
    const box = el => {                                                                                // placering i forhold til .proc via offset (ignorerer transform)
      let x = 0, y = 0, n = el;
      while (n && n !== proc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { left: x, top: y, right: x + el.offsetWidth, width: el.offsetWidth, height: el.offsetHeight };
    };
    const svg = mk('svg', 'ink-line ink-proc'); svg.setAttribute('aria-hidden', 'true'); proc.appendChild(svg);
    inkPath(proc, svg, () => {
      // målt uden transform: overskriften og rækkerne glider ind med en animation, og stregen skal sidde, hvor de ender
      const pr = { left: 0, top: 0, width: proc.offsetWidth, height: proc.offsetHeight }, lr = box(lab), tr = box(txt), rr = box(rowsEl);
      const items = [...rowsEl.querySelectorAll('.pr')].map(box);
      const left = rr.left, right = rr.right, pad = clamp(left * .45, 8, 34), mx = right + pad;
      const y0 = lr.top + lr.height / 2, x0 = tr.right + 12;
      const pts = wobbly(x0, right - 10, y0, rs, []);
      const firstMid = items[0].top + items[0].height / 2;
      for (let k = 1; k <= 18; k++) { const u = k / 18, b = 1 - u; pts.push([b * b * (right - 10) + 2 * b * u * (mx + pad * .6) + u * u * mx, b * b * y0 + 2 * b * u * (y0 + 10) + u * u * (firstMid - 30)]); }
      const blots = [], marks = [];
      items.forEach((r, i) => {
        const cx = (r.left + r.right) / 2, cy = r.top + r.height / 2;
        const a = (right - left) / 2 + pad * .8, b = r.height / 2 + 2, s0 = -.32, s1 = TAU + .55, n = 90, wob = rs() * 9;
        for (let k = 0; k <= n; k++) {                                                               // ring med lidt overlap, som når man slår ring om noget med en pen
          const t = s0 + (s1 - s0) * k / n, c = Math.cos(t), s = Math.sin(t), e = .32;                // e < 1 giver en firkantet ellipse
          const rx = a * (1 + .012 * Math.sin(t * 3 + wob)) * (1 + .03 * k / n), ry = b * (1 + .03 * Math.sin(t * 2 + wob)) * (1 - .05 * k / n);
          pts.push([cx + Math.sign(c) * Math.pow(Math.abs(c), e) * rx, cy + Math.sign(s) * Math.pow(Math.abs(s), e) * ry + (rs() - .5) * .6]);
          if (k === Math.round(n * .42)) marks.push(pts.length - 1);
        }
        const p = pts[pts.length - 1];
        if (i < items.length - 1) {                                                                  // videre ned langs højre margen til næste trin
          const nx = items[i + 1], ny = nx.top + nx.height / 2;
          for (let k = 1; k <= 8; k++) { const u = k / 8; pts.push([p[0] + (mx - p[0]) * Math.sin(u * Math.PI / 2) + Math.sin(u * Math.PI) * pad * .4, p[1] + (ny - 30 - p[1]) * u]); }
        } else {
          for (let k = 1; k <= 10; k++) pts.push([p[0] + k * 2.2, p[1] + k * 3.2 + Math.sin(k / 10 * Math.PI) * 6]);
          marks.push(pts.length - 1);
        }
      });
      marks.forEach((ix, j) => { const big = j === marks.length - 1 || j % 2 === 0; blots.push({ p: pts[ix], i: ix, shapes: blotShape(pts[ix], big ? 6 + rs() * 5 : 3 + rs() * 2.5, rs, big) }); });
      [.18, .5, .78].forEach(f => { const ix = Math.floor(pts.length * f); blots.push({ p: pts[ix], i: ix, shapes: blotShape(pts[ix], 2.2 + rs() * 2, rs, false) }); });
      svg.setAttribute('width', pr.width); svg.setAttribute('height', pr.height); svg.setAttribute('viewBox', '0 0 ' + pr.width + ' ' + pr.height);
      svg.style.left = '0px'; svg.style.top = '0px';
      return { pts, blots };
    }, () => innerHeight * .82 - proc.getBoundingClientRect().top);
  });
})();
