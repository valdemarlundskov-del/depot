/* BK Studio — blæk.
   Den lille streg efter sektionsetiketterne "(01) Ydelser", "(02) Proces", "(03) Teamet" og "(04) Kontakt" er en håndtegnet blækstreg,
   der tegner sig ud, når man scroller hen til den. Den slutter med en lille krølle og drypper et par blækklatter.
   Klatterne tegnes her i koden (ingen billedfiler). */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }

  // ---------- klatter ----------
  // alle former vendes samme vej rundt, så de smelter sammen til én flade, når de udfyldes (ellers bliver overlap til huller)
  function orient(pts) {
    let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return a < 0 ? pts.reverse() : pts;
  }
  // en organisk dråbe
  function blob(cx, cy, r, rnd, n) {
    n = n || 16;
    const k1 = rnd() * TAU, k2 = rnd() * TAU, a1 = .08 + rnd() * .14, a2 = .04 + rnd() * .07, f1 = 2 + ((rnd() * 3) | 0), f2 = 5 + ((rnd() * 4) | 0), pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / n * TAU, rr = r * (1 + a1 * Math.sin(f1 * t + k1) + a2 * Math.sin(f2 * t + k2) + (rnd() - .5) * .06);
      pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]);
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
    return orient(L.concat(cap, Rt.reverse()));
  }
  // en klat: hovedklat, stråler, små dråber og fint sprøjt rundt om
  function splat(x, y, size, rnd, opt) {
    const shapes = [blob(x, y, size, rnd, 22)];
    for (let i = 0; i < opt.tendrils; i++) shapes.push(tendril(x, y, rnd() * TAU, size * .55, size * (.7 + rnd() * 2), size * (.1 + rnd() * .12), size * (.07 + rnd() * .1), rnd));
    for (let i = 0; i < opt.drops; i++) { const a = rnd() * TAU, d = size * (1.3 + rnd() * 2.2); shapes.push(blob(x + Math.cos(a) * d, y + Math.sin(a) * d, size * (.06 + rnd() * .14), rnd, 10)); }
    for (let i = 0; i < opt.spray; i++) { const a = rnd() * TAU, d = size * (1.2 + rnd() * 3.2); shapes.push(blob(x + Math.cos(a) * d, y + Math.sin(a) * d, .35 + rnd() * .8, rnd, 6)); }
    return shapes;
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

  // ---------- blækstregen ----------
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, cls) => { const n = document.createElementNS(NS, tag); if (cls) n.setAttribute('class', cls); return n; };
  // glat kurve gennem punkterne + længden målt langs punkterne (til klatternes placering)
  function smooth(pts) {
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1); const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      d += 'Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + ((p[0] + q[0]) / 2).toFixed(1) + ' ' + ((p[1] + q[1]) / 2).toFixed(1);
      cum.push(cum[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1]));
    }
    const l = pts[pts.length - 1]; d += 'L' + l[0].toFixed(1) + ' ' + l[1].toFixed(1);
    return { d, cum };
  }
  // en let rystende vandret linje fra x0 til x1
  function wobbly(x0, x1, y, rs) {
    const out = [], n = Math.max(2, Math.round(Math.abs(x1 - x0) / 14)), ph = rs() * 9;
    for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n; out.push([x, y + Math.sin(x * .013 + ph) * 1.8 + Math.sin(x * .043 + ph * 2) * .9 + (rs() - .5) * .7]); }
    return out;
  }

  document.querySelectorAll('.m-idx').forEach((lab, li) => {
    const txt = lab.lastElementChild; if (!txt) return;
    lab.classList.add('ink-on');
    const svg = mk('svg', 'ink-line'); svg.setAttribute('aria-hidden', 'true');
    const line = mk('path', 'ink-stroke'), tip = mk('circle', 'ink-tip'); tip.setAttribute('r', '3.2');
    svg.appendChild(line); svg.appendChild(tip); lab.appendChild(svg);
    const edge = lab.closest('.section-head') || lab.parentElement;
    let L = 1, blots = [], cur = 0, target = 0, raf = 0;

    function build() {
      // stregen løber fra etiketten hen til kanten af sektionens indhold og slutter med en lille krølle
      const lr = lab.getBoundingClientRect(), x0 = txt.offsetLeft + txt.offsetWidth + 12, y = lab.clientHeight / 2;
      const x1 = Math.max(x0 + 60, Math.min(edge.getBoundingClientRect().right - lr.left - 24, x0 + 900)), W = x1 + 40, H = 70;
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 ' + (y - H / 2) + ' ' + W + ' ' + H);
      svg.style.top = (y - H / 2) + 'px';
      const pts = wobbly(x0, x1, y, rng(1000 + li * 97));
      for (let k = 1; k <= 10; k++) { const t = k / 10 * TAU * .85; pts.push([x1 + Math.sin(t) * 9 + k * .6, y - (1 - Math.cos(t)) * 7]); }
      const s = smooth(pts), total = s.cum[s.cum.length - 1] || 1;
      line.setAttribute('d', s.d); L = line.getTotalLength() || 1; line.style.strokeDasharray = L + ' ' + L;
      blots.forEach(b => b.el.remove()); blots = [];
      const r2 = rng(2000 + li * 31), end = pts.length - 1, mid = Math.round(end * .55);
      [[mid, 2 + r2() * 1.5, { tendrils: r2() < .5 ? 1 : 0, drops: 2, spray: 4 }], [end, 4.5 + r2() * 2.5, { tendrils: 3 + ((r2() * 3) | 0), drops: 4, spray: 10 }]].forEach(b => {
        const p = pts[b[0]], el = mk('path', 'ink-blot');
        el.setAttribute('d', svgD(splat(p[0], p[1], b[1], r2, b[2]))); el.style.transformOrigin = p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px';
        svg.insertBefore(el, tip); blots.push({ el, f: s.cum[b[0]] / total });
      });
      update(true);
    }
    function paint() {
      line.style.strokeDashoffset = (L * (1 - cur)).toFixed(1);
      blots.forEach(b => b.el.classList.toggle('on', cur >= b.f - .002));
      if (cur > .002 && cur < .998) { const q = line.getPointAtLength(L * cur); tip.setAttribute('cx', q.x.toFixed(1)); tip.setAttribute('cy', q.y.toFixed(1)); tip.style.opacity = 1; } else tip.style.opacity = 0;
    }
    function step() {                                                                                // pennen tegner stregen blødt færdig
      raf = 0; const d = target - cur;
      cur = Math.abs(d) < .002 ? target : cur + d * .06 + Math.sign(d) * .003;
      if ((d > 0 && cur > target) || (d < 0 && cur < target)) cur = target;
      paint(); if (cur !== target) raf = requestAnimationFrame(step);
    }
    // tegnes, når etiketten er kommet et stykke ind på skærmen; viskes ud igen, hvis man scroller op forbi den
    function update(now) {
      target = reduce || lab.getBoundingClientRect().top < innerHeight * .86 ? 1 : 0;
      if (now === true || reduce) { cur = target; paint(); } else if (!raf) raf = requestAnimationFrame(step);
    }
    let q = false;
    addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; update(); }); } }, { passive: true });
    let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(build, 120); }).observe(edge);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    build();
  });
})();
