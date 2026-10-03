// BK Studio — forsiden: billedvæg der flyver ind og bliver stående som en let buet flade.
// Bruger ARCHIVE (archive.js). Træk for at flytte, hold musen over for farve, scroll for at komme videre.
(function () {
  const sec = document.querySelector('[data-wall]');
  if (!sec || typeof ARCHIVE === 'undefined') return;
  const world = document.getElementById('wallWorld');
  const capEl = document.getElementById('wallCap');
  const filterEl = document.getElementById('wallFilter');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(any-hover:none)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const year = p => { const x = typeof projects !== 'undefined' && projects.find(q => q.id === p); return x ? x.year : ''; };
  const defaultCap = () => `<b>Arkivet</b><span>${ARCHIVE.length} billeder</span>`;
  const capFor = a => `<b>${ARCHIVE_LABELS[a.p] || a.p}</b>${year(a.p) ? `<span>${year(a.p)}</span>` : ''}`;
  capEl.innerHTML = defaultCap();

  let W = 0, H = 0, cols = 0, rows = 0, pitchX = 0, pitchY = 0, cw = 0, ch = 0, R = 1, cards = [];
  let off = 0, vel = 0, offY = 0, velY = 0, last = 0, t0 = 0, visible = true, started = false, hover = null, filter = 'alle';
  let mx = 0, my = 0, cmx = 0, cmy = 0, drag = null, moved = false;

  function build() {
    W = sec.clientWidth; H = sec.clientHeight;
    const nar = W < 700;
    const visCols = nar ? 2.5 : 5;
    pitchX = W / visCols; cw = pitchX * .93; ch = cw * (nar ? .82 : .57); pitchY = ch + pitchX * .06;
    cols = nar ? 8 : 9; rows = Math.ceil(H / pitchY) + 4; if (rows % 2 === 0) rows++;     // ekstra rækker, så man kan trække lodret/diagonalt uden huller
    R = W * (nar ? 2.6 : 1.9);
    world.innerHTML = ''; cards = [];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let n = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = ARCHIVE[n++ % ARCHIVE.length];
      const el = document.createElement('a');
      el.className = 'wc'; el.href = `arkiv.html#${a.p}`; el.tabIndex = -1;
      el.style.width = cw.toFixed(0) + 'px'; el.style.height = ch.toFixed(0) + 'px';
      el.innerHTML = `<img src="${a.m}" srcset="${a.m} 480w, ${a.t} 1100w" sizes="${Math.round(cw)}px" alt="" width="${a.w}" height="${a.h}" decoding="async" draggable="false">`;
      world.appendChild(el);
      const dx = (c - (cols - 1) / 2) * pitchX, dy = (r - (rows - 1) / 2) * pitchY;
      cards.push({ el, a, c, r, rz: (rnd() - .5) * 2.6, d: Math.hypot(dx / W, dy / H) * 520 + rnd() * 220, lift: 0, op: 0 });
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || !started) { last = now; return; }
    if (!t0) t0 = now;
    if (!last) last = now;
    const dt = Math.min(64, now - last); last = now;
    const t = now - t0;
    // inerti og rolig drift
    if (!drag) {
      off += vel * dt; vel *= Math.pow(.94, dt / 16);
      offY += velY * dt; velY *= Math.pow(.94, dt / 16);
      if (!reduce && !hover && t > 1800 && Math.abs(vel) < .02) off -= dt * .012;
    }
    cmx += (mx - cmx) * .06; cmy += (my - cmy) * .06;
    world.style.transform = `rotateY(${(cmx * -4).toFixed(2)}deg) rotateX(${(cmy * 3).toFixed(2)}deg)`;
    const span = cols * pitchX, spanY = rows * pitchY;
    for (let i = 0; i < cards.length; i++) {
      const k = cards[i];
      const a = reduce ? 1 : clamp((t - k.d) / 900), ap = 1 - Math.pow(1 - a, 3);
      let x = (k.c - (cols - 1) / 2) * pitchX + off;
      x = ((x + span / 2) % span + span) % span - span / 2;
      let y = (k.r - (rows - 1) / 2) * pitchY + offY;
      y = ((y + spanY / 2) % spanY + spanY) % spanY - spanY / 2;                 // rækkerne løber rundt lodret, ligesom kolonnerne gør vandret
      y -= cmy * 22;
      const fx = 1 + (1 - ap) * .7;
      const z = (x * x + y * y) / (2 * R) + k.lift - (1 - ap) * 2600;
      k.lift += ((k === hover ? 100 : 0) - k.lift) * .16;
      const ry = -Math.atan(x / R) * 57.3, rx = Math.atan(y / R) * 57.3;
      const dim = filter !== 'alle' && k.a.p !== filter;
      const target = dim ? .1 : 1; k.op += (target - k.op) * .12;
      k.el.style.opacity = (ap * k.op).toFixed(3);
      k.el.style.visibility = ap * k.op < .01 ? 'hidden' : 'visible';
      k.el.style.transform = `translate(-50%,-50%) translate3d(${(x * fx).toFixed(1)}px,${(y * fx).toFixed(1)}px,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${k.rz.toFixed(2)}deg)`;
      if (touch) k.el.classList.toggle('mid', Math.abs(x) < pitchX * .6 && Math.abs(y) < pitchY * 1.1);
    }
  }

  // hover: farve + navn
  const byEl = new Map();
  function index() { cards.forEach(k => byEl.set(k.el, k)); }
  world.addEventListener('mouseover', e => {
    const el = e.target.closest('.wc'); if (!el) return;
    hover = byEl.get(el) || null; el.classList.add('hov');
    if (hover) capEl.innerHTML = capFor(hover.a);
  });
  world.addEventListener('mouseout', e => {
    const el = e.target.closest('.wc'); if (!el) return;
    el.classList.remove('hov'); if (hover && hover.el === el) hover = null;
    capEl.innerHTML = defaultCap();
  });
  sec.addEventListener('mousemove', e => { const r = sec.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; });
  sec.addEventListener('mouseleave', () => { mx = 0; my = 0; });

  // træk for at flytte (vandret); lodret scroll bevares
  sec.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.wall-ui button, .wall-ui a')) return;
    drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), active: false, free: e.pointerType !== 'touch' }; moved = false;
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
    if (!drag.active) {
      const ax = Math.abs(e.clientX - drag.x), ay = Math.abs(e.clientY - drag.y);
      if (Math.max(ax, ay) < 6) return;
      if (!drag.free && ay > ax) { drag = null; return; }        // på touch bevares lodret scroll af siden
      drag.active = true; moved = true; sec.classList.add('drag');
    }
    const now = performance.now(), dt = Math.max(8, now - drag.lt);
    off += dx; vel = dx / dt;
    if (drag.free) { offY += dy; velY = dy / dt; }               // mus/pen: træk frit, også diagonalt
    drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;
  });
  const end = () => { if (drag) { drag = null; sec.classList.remove('drag'); } };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  world.addEventListener('click', e => {
    if (moved) { e.preventDefault(); moved = false; return; }
    const el = e.target.closest('.wc'); const k = el && byEl.get(el);
    if (k && window.ARK_OPEN) { e.preventDefault(); window.ARK_OPEN(ARCHIVE.indexOf(k.a)); }
  });
  sec.addEventListener('dragstart', e => e.preventDefault());

  // filter
  const counts = {}; ARCHIVE.forEach(a => { counts[a.p] = (counts[a.p] || 0) + 1; });
  const chips = [['alle', 'Alle'], ...Object.keys(ARCHIVE_LABELS).filter(p => counts[p]).map(p => [p, ARCHIVE_LABELS[p]])];
  filterEl.innerHTML = chips.map(([p, l]) => `<button type="button" data-f="${p}" aria-pressed="${p === 'alle'}">${l}</button>`).join('');
  filterEl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filter = b.dataset.f;
    filterEl.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    document.dispatchEvent(new CustomEvent('arkfilter', { detail: filter }));
  });
  document.addEventListener('arkfilter', e => {
    if (e.detail === filter) return;
    filter = e.detail;
    filterEl.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.f === filter));
  });

  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!started && es[0].intersectionRatio >= .3) { started = true; t0 = 0; last = 0; } }, { threshold: [0, .3] }).observe(sec);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const o = off; build(); index(); off = o; t0 = performance.now() - 5000; }, 200); });
  build(); index();
  requestAnimationFrame(frame);
})();
