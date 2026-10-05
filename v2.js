// BK Studio v2 — dynamik: hero-parallax, projekt-marquee, billedbånd, reveal og burst (Arbejde).
// Bruger `projects` fra script.js.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const th = src => src.replace('images/', 'images/thumbs/');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const hasData = typeof projects !== 'undefined';
  const accents = ['var(--c5)', 'var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)'];

  // Forsiden: projektkort svævende i 3D-rum
  const stage = document.getElementById('w3dStage');
  const sec3d = document.querySelector('[data-w3d]');
  // Kortene står på en cirkel i 3D-rum bag overskriften og kredser langsomt rundt (se "w3-ring" nederst). Her bygges kortene.
  const RING = [[16, '3/4'], [19, '4/3'], [15, '4/5'], [17, '1/1'], [18, '3/4'], [20, '4/3'], [15, '3/4'], [17, '4/5'], [19, '4/3'], [16, '1/1'], [18, '3/4'], [17, '4/3']];
  function buildRing() {
    if (!stage || !hasData) return;
    const pool = [];
    const DARK = ['DSC03359', 'DSC03361', 'DSC03363', 'DSC04197', 'DSC04209', 'DSC04225', 'DSC04234', 'DSC04240', 'DSC03610', 'DSC03802'];   // for mørke billeder i en ring, der skal ses bag overskriften
    for (let k = 0; k < 8; k++) projects.forEach(p => { const g = p.gallery[(k * 3 + 1) % p.gallery.length]; if (!DARK.some(d => g.indexOf(d) >= 0)) pool.push({ p, g }); });
    const seen = new Set(), picks = [];
    pool.forEach(it => { if (!seen.has(it.g)) { seen.add(it.g); picks.push(it); } });
    const small = innerWidth <= 900, n = small ? 6 : 9, m = small ? 1.6 : .82;
    stage.querySelectorAll('.w3c').forEach(c => c.remove());
    const html = Array.from({ length: n }, (_, i) => {
      const s = RING[i % RING.length], it = picks[i % picks.length];
      return `<a class="w3c" style="--w:${(s[0] * m).toFixed(1)}vw;--a:${s[1]}" href="/arbejde#${it.p.id}" aria-label="Se projektet ${it.p.title}"><span class="w3c-in"><img src="${th(it.g)}" alt="" decoding="async"><em>${it.p.title}</em></span><b class="w3c-cta" aria-hidden="true">Se projekt</b></a>`;
    }).join('');
    stage.insertAdjacentHTML('beforeend', html);
    if (window.__w3Layout) window.__w3Layout();
  }
  buildRing();
  window.__w3Rebuild = buildRing;

  // Reserve: en klasse følger musen, så blur og "Se projekt" vises, selv hvis browserens :hover ikke rammer de skrå 3D-kort
  document.addEventListener('pointerover', e => {
    const c = e.target.closest && e.target.closest('.w3c');
    document.querySelectorAll('.w3c.is-hover').forEach(x => { if (x !== c) x.classList.remove('is-hover'); });
    if (c) c.classList.add('is-hover');
  });
  document.addEventListener('pointerleave', () => document.querySelectorAll('.w3c.is-hover').forEach(x => x.classList.remove('is-hover')));

  // Arbejde: billederne spreder sig, mens man scroller
  const spots = [[-36, -16, -8, 1, 19, '4/5'], [34, -14, 7, 1, 17, '4/5'], [39, 30, -7, 1, 17, '3/4'],
                 [-2, -47, -3, 1, 22, '4/3'], [12, 47, 4, 1, 17, '3/4']];
  const host = document.getElementById('bursts');
  if (host && hasData) {
    const latestOnly = projects.filter(p => p.latest);            // øverst vises kun det seneste projekt; de andre ligger i "Alle projekter"
    host.innerHTML = (latestOnly.length ? latestOnly : projects.slice(0, 1)).map((p, i) => {
      const pics = p.gallery.filter(g => g !== p.cover).slice(0, 5);          // start: tre billeder i spalter (hovedbillede + de to første); resten folder sig ud
      const shards = pics.map((src, j) => {
        const s = spots[j];
        const start = j === 0 ? '--x0:calc(-1 * (var(--cw0) + 2vw));--y0:0px;--w0:var(--cw0);--o0:1;--s0:1;' : j === 1 ? '--x0:calc(var(--cw0) + 2vw);--y0:0px;--w0:var(--cw0);--o0:1;--s0:1;' : '--x0:0px;--y0:0px;--w0:calc(var(--cw0) * .8);--o0:0;--s0:.55;';
        return `<div class="shard" style="${start}--x:${s[0]}vw;--y:${s[1]}vh;--r:${s[2]}deg;--z:${j % 2 ? 3 : 2};--w:${s[4]}vw;--a:${s[5]}"><img src="${th(src)}" alt="" decoding="async"></div>`;
      }).join('');
      return `<section class="burst"><div class="burst-stage" data-scrub>
        ${shards}
        <a class="burst-cover" href="/arbejde#${p.id}" data-open="${p.id}" aria-label="Se projektet ${p.title}"><img src="${th(p.cover)}" alt="${p.title}" decoding="async"></a>
        <span class="burst-count">${p.year}</span>
        <div class="burst-copy"><h3>${p.title}</h3><p class="cat">${p.category} — ${p.year}</p><p>${p.summary}</p><a class="btn" href="/arbejde#${p.id}" data-open="${p.id}"><span>Se hele projektet</span></a></div>
      </div></section>`;
    }).join('');
    host.addEventListener('click', e => {
      const a = e.target.closest('[data-open]');
      if (!a || typeof openProject !== 'function' || !document.getElementById('overlay')) return;
      e.preventDefault();
      openProject(a.dataset.open);
    });
  }




  // Levende højdekurver (marching squares på bevægelig støj). Bruges bag "Vi skaber billeder, der bliver hængende" og "Skriv til os".
  function initFlow(sec, cv, cfg) {
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const LV = [-1.5, -1.3, -1.1, -.9, -.7, -.5, -.3, -.1, .1, .3, .5, .7, .9, 1.1, 1.3, 1.5];
    let W = 0, H = 0, K = 1, dpr = 1, cell = 24, cols = 0, rows = 0, F = null, vis = false, mx = 0, my = 0, tmx = 0, tmy = 0, amp = 0, tamp = 0, vy = 0, lastY = scrollY;
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 1.5); W = sec.clientWidth; H = sec.clientHeight; K = Math.max(.32, Math.max(W, H) / 1440);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cell = Math.max(18, Math.round(Math.min(W, 1600) / 62)); cols = Math.ceil(W / cell) + 2; rows = Math.ceil(H / cell) + 2; F = new Float32Array(cols * rows);
      tmx = mx = W * .5; tmy = my = H * .5;
    }
    // Støj med flere knæk: koordinaterne vrides først af en anden støj (domænevridning), og der lægges finere led ovenpå, så kurverne får organiske knæk og bugter.
    const noise = (X, Y, t) => {
      let x = X / K, y = Y / K;
      const kk = cfg.kink || 1;
      x += (Math.sin(y * .011 + t * .31) * 42 + Math.sin(y * .027 - t * .22) * 16) * kk;
      y += (Math.sin(x * .009 - t * .27) * 38 + Math.sin(x * .023 + t * .19) * 14) * kk;
      return (Math.sin(x * .0061 + t * .21) * .5 + Math.sin(y * .0083 - t * .17 + x * .0021) * .4 + Math.sin((x + y) * .0044 + t * .13) * .4
        + Math.sin(Math.hypot(x - W / K * .7, y - H / K * .4) * .0058 - t * .25) * .5
        + (Math.sin(x * .019 + y * .013 + t * .4) * .3 + Math.sin(y * .031 - x * .011 - t * .33) * .22 + Math.sin((x - y) * .027 + t * .5) * .16) * kk) * 1.05;
    };
    // Mønstret står stille. Kun dér, hvor musen bevæger sig, flyder linjerne: fasen ændres lokalt omkring markøren, i takt med at musen flytter sig,
    // og den falder blødt tilbage, når musen forlader området.
    let tTarget = 0, tAcc = 0, lw = 0, lwT = 0, drawn = false, lastX = null, lastYm = null, lastT = 0;
    const t0 = cfg.t0 || 0, sg = (cfg.reach || 200) * .8, rb = (cfg.reach || 200) * .62;
    function draw(now) {
      const dtt = lastT ? Math.min(.12, (now - lastT) / 1000) : .016; lastT = now;                                  // blød udjævning efter tid (uafhængig af billedhastighed)
      const e1 = 1 - Math.exp(-dtt * 6), e2 = 1 - Math.exp(-dtt * 8), e3 = 1 - Math.exp(-dtt * 4);
      lw += (lwT - lw) * e1; tAcc += (tTarget - tAcc) * e2;
      if (drawn && Math.abs(lwT - lw) < .004 && Math.abs(tTarget - tAcc) < .003 && amp < .002 && Math.abs(tamp - amp) < .003) { lw = lwT; tAcc = tTarget; amp = tamp; return; }       // intet bevæger sig: intet at tegne
      mx += (tmx - mx) * (1 - Math.exp(-dtt * 10)); my += (tmy - my) * (1 - Math.exp(-dtt * 10)); amp += (tamp - amp) * e3;
      drawn = true;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = i * cell, y = j * cell, dxm = x - mx, dym = y - my, d2 = dxm * dxm + dym * dym;
        const tl = reduce ? t0 : t0 + tAcc * lw * Math.exp(-d2 / (2 * sg * sg));            // lokal tid: kun nær musen
        let v = noise(x, y, tl);
        if (amp > .002) { v += amp * cfg.bump * Math.exp(-d2 / (2 * rb * rb)); if (cfg.ring) v += amp * .22 * Math.sin(Math.sqrt(d2) * .035 - tl * 3) * Math.exp(-d2 / (2 * (rb * 1.5) ** 2)); }
        F[j * cols + i] = v;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineJoin = 'round';
      for (let li = 0; li < LV.length; li++) {
        const L = LV[li], major = li % 4 === 1;
        ctx.strokeStyle = cfg.light ? (major ? 'rgba(20,20,20,.28)' : 'rgba(20,20,20,.12)') : (major ? 'rgba(247,247,245,.5)' : 'rgba(247,247,245,.2)'); ctx.lineWidth = major ? 1.4 : 1; ctx.beginPath();
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
          const a = F[j * cols + i], b = F[j * cols + i + 1], c = F[(j + 1) * cols + i + 1], d = F[(j + 1) * cols + i];
          const k = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
          if (k === 0 || k === 15) continue;
          const x = i * cell, y = j * cell;
          const tx = x + (L - a) / (b - a) * cell, ty = y, rx = x + cell, ry = y + (L - b) / (c - b) * cell, bx = x + (L - d) / (c - d) * cell, by = y + cell, lx = x, ly = y + (L - a) / (d - a) * cell;
          const seg = (x1, y1, x2, y2) => { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); };
          switch (k) {
            case 1: case 14: seg(lx, ly, bx, by); break;
            case 2: case 13: seg(bx, by, rx, ry); break;
            case 3: case 12: seg(lx, ly, rx, ry); break;
            case 4: case 11: seg(tx, ty, rx, ry); break;
            case 5: seg(tx, ty, lx, ly); seg(bx, by, rx, ry); break;
            case 6: case 9: seg(tx, ty, bx, by); break;
            case 7: case 8: seg(tx, ty, lx, ly); break;
            case 10: seg(tx, ty, rx, ry); seg(lx, ly, bx, by); break;
          }
        }
        ctx.stroke();
      }
    }
    function loop(now) { requestAnimationFrame(loop); if (vis) draw(now); }
    sec.addEventListener('pointerenter', () => { lwT = 1; });
    sec.addEventListener('pointermove', e => {
      const r = sec.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (lastX !== null) tTarget += Math.min(Math.hypot(x - lastX, y - lastYm), 28) * .0036 * (cfg.speed || 1);       // små bevægelser giver små ændringer; store hop er begrænset
      lastX = x; lastYm = y; tmx = x; tmy = y; tamp = 1; lwT = 1;
    });
    sec.addEventListener('pointerleave', () => { tamp = 0; lwT = 0; lastX = null; });
    new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(sec);
    addEventListener('resize', () => { resize(); drawn = false; });
    resize(); if (reduce) draw(0); else requestAnimationFrame(loop);
  }
  const ctaSec = document.querySelector('.cta-big'), w3Sec = document.querySelector('.w3d');
  if (ctaSec) initFlow(ctaSec, ctaSec.querySelector('.cta-flow'), { speed: 1, bump: .6, reach: 170, kink: .8, t0: 3.2 });
  if (w3Sec) initFlow(w3Sec, w3Sec.querySelector('.w3d-flow'), { speed: 1, bump: .6, reach: 170, kink: .8, t0: 3.2 });          // samme blide bølger som under "Har du noget, der skal skabes?"


  // Ydelserne side om side: det første står på siden, de andre kommer ind fra højre og går mod venstre, mens man scroller.
  // Bevægelsen følger scroll med en blød dæmpning (ingen hak ved hjul-trin), og målene måles kun ved indlæsning og resize.
  (function () {
    const sec = document.querySelector('[data-svc]');
    if (!sec) return;
    const row = sec.querySelector('.svc-row3'), cards = [...row.children];
    const sm = v => { v = clamp(v); return v * v * (3 - 2 * v); };
    let cur = -1, run = false, geo = { vw: 0, x0: [], over: 0, secH: 1, vh: 1 };
    function measure() {
      const vw = innerWidth; geo.vw = vw; geo.vh = innerHeight; geo.secH = sec.offsetHeight;
      const rl = row.getBoundingClientRect().left - (vw <= 1180 ? 0 : 0);
      geo.x0 = cards.map(c => vw - (row.getBoundingClientRect().left + c.offsetLeft) + 40);
      geo.over = Math.max(0, row.scrollWidth - row.parentElement.clientWidth);
    }
    function target() {
      const r = sec.getBoundingClientRect();
      const lead = geo.vh * .62;                                       // kortene begynder at komme ind, så snart man er forbi overskriften, og ikke først når sektionen er låst fast
      return reduce ? 1 : clamp((lead - r.top) / Math.max(1, geo.secH - geo.vh + lead));
    }
    function apply(p) {
      if (geo.vw <= 1180) {
        // mobil: sporet glider først ind fra højre, og derefter videre mod venstre gennem alle kort
        row.style.transform = 'translate3d(' + ((1 - sm(p / .26)) * geo.vw - sm((p - .24) / .76) * geo.over).toFixed(1) + 'px,0,0)';
        cards.forEach(c => { c.style.transform = ''; });
      } else {
        row.style.transform = '';
        const e = [sm(p / .26), sm((p - .18) / .3), sm((p - .38) / .3), sm((p - .58) / .36)];      // alle fire kommer ind fra højre, ét efter ét
        for (let i = 0; i < cards.length; i++) cards[i].style.transform = 'translate3d(' + (geo.x0[i] * (1 - e[i])).toFixed(1) + 'px,0,0)';
      }
    }
    function tick() {
      const t = target();
      if (cur < 0) cur = t;
      cur += (t - cur) * .16;
      if (Math.abs(t - cur) < .0004) cur = t;
      apply(cur);
      if (cur !== t) requestAnimationFrame(tick); else run = false;
    }
    const kick = () => { if (!run) { run = true; requestAnimationFrame(tick); } };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', () => { row.style.transform = ''; cards.forEach(c => { c.style.transform = ''; }); measure(); cur = -1; kick(); });
    measure(); cur = -1; kick();
  })();

  // Reveal
  const rvs = [...document.querySelectorAll('[data-rv]')];
  if (!reduce && 'IntersectionObserver' in window) {
    rvs.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= .12) e.target.classList.add('in'); else if (!e.isIntersecting && e.boundingClientRect.top > 0) e.target.classList.remove('in'); }), { threshold: [0, .12] });
    rvs.forEach(el => io.observe(el));
  }

  // Udsagn: ordene tændes, mens man scroller
  const wordsEl = document.querySelector('[data-words]');
  let words = [];
  if (wordsEl && !reduce) {
    const text = wordsEl.textContent.trim();
    wordsEl.setAttribute('aria-label', text);
    wordsEl.innerHTML = text.split(/\s+/).map(w => `<span class="sw" aria-hidden="true">${w}</span>`).join(' ');
    words = [...wordsEl.querySelectorAll('.sw')];
  }
  const cards = [...document.querySelectorAll('.sc')];
  const scrubs = [...document.querySelectorAll('[data-scrub]')];
  const marq = document.querySelector('[data-marq]');
  // Præcis løkkelængde: afstanden fra første element til første element i næste gentagelse (inkl. mellemrum), så båndet aldrig hopper tilbage
  const periodOf = (el, repeats) => { const k = el.children, n = Math.round(k.length / repeats); return (n >= 1 && k[n]) ? (k[n].offsetLeft - k[0].offsetLeft) : 0; };
  let marqP = 0;
  const calcPeriods = () => { if (marq) marqP = periodOf(marq, 4); };
  calcPeriods(); addEventListener('resize', calcPeriods); addEventListener('load', calcPeriods);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(calcPeriods);
  let lastY = scrollY, vel = 0;
  const strip = document.querySelector('[data-strip]');
  let queued = false;

  function frame() {
    queued = false;
    const vh = innerHeight, y = scrollY;
    scrubs.forEach(el => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -50 || box.top > vh + 50) return;
      el.style.setProperty('--p', reduce ? 1 : clamp(-box.top / (box.height - vh)).toFixed(4));
    });
    if (reduce) return;
    vel += ((y - lastY) - vel) * .18; lastY = y;
    const skew = clamp(vel * -.35, -9, 9);
    if (marq) marq.style.transform = `translate3d(${(-(y * .35) % (marqP || marq.scrollWidth / 4)).toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
    if (words.length) {
      const r = wordsEl.getBoundingClientRect();
      const p = clamp((vh * .88 - r.top) / (vh * .88 - vh * .28));
      const n = words.length;
      words.forEach((w, i) => { w.style.opacity = (.16 + .84 * clamp(p * (n + 4) - i)).toFixed(2); });
    }
    cards.forEach((c, i) => {
      const nx = cards[i + 1];
      if (!nx || innerWidth <= 900) { c.style.transform = ''; c.style.filter = ''; return; }
      const t = nx.getBoundingClientRect().top;
      const q = clamp(1 - (t - (92 + (i + 1) * 20)) / (vh * .55));
      c.style.transform = `scale(${(1 - q * .05).toFixed(4)})`;
      c.style.filter = `brightness(${(1 - q * .12).toFixed(3)})`;
    });
    if (strip) {
      const r = strip.parentElement.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height * .6));
      const dist = Math.max(0, strip.scrollWidth - innerWidth);
      strip.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
    }
    if (Math.abs(vel) > .05) req();
  }
  // Musen vipper hele 3D-scenen let
  if (sec3d && stage && !reduce && matchMedia('(any-hover:hover)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, run = false;
    const loop = () => {
      cx += (tx - cx) * .07; cy += (ty - cy) * .07;
      stage.style.setProperty('--tiltY', (cx * 9).toFixed(2) + 'deg');
      stage.style.setProperty('--tiltX', (-cy * 6).toFixed(2) + 'deg');
      run = Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002;
      if (run) requestAnimationFrame(loop);
    };
    const kick = () => { if (!run) { run = true; requestAnimationFrame(loop); } };
    sec3d.addEventListener('mousemove', e => { const r = sec3d.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; kick(); });
    sec3d.addEventListener('mouseleave', () => { tx = 0; ty = 0; kick(); });
  }
  const req = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  addEventListener('load', req);
  frame();
})();

/* w3-ring: kortene står på en cirkel bag overskriften "Vi skaber billeder, der bliver hængende" og kredser langsomt rundt.
   De bagerste er mindre og mørkere, de forreste større og lysere (dybde). Scroll drejer ringen, og den bremser, når man peger på et kort. */
(function () {
  const stage = document.getElementById('w3dStage'), sec = document.querySelector('[data-w3d]');
  if (!stage || !sec) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let auto = 0, speed = 1, vis = false, last = 0, raf = 0;
  const TAU = Math.PI * 2, held = c => c.matches(':hover') || c.classList.contains('is-hover');
  function layout(t) {
    const cards = stage.querySelectorAll('.w3c'), n = cards.length; if (!n) return;
    const W = innerWidth, H = innerHeight, small = W <= 900;
    const Rx = W * (small ? .44 : .46), Rz = W * (small ? .32 : .3), Ky = H * (small ? .1 : .15);
    const rot = auto + scrollY * .0011;
    for (let i = 0; i < n; i++) {
      const c = cards[i], th = i * TAU / n + rot, s = Math.sin(th), co = Math.cos(th);   // co: 1 = forrest, -1 = bagerst
      const hv = held(c) ? 1 : 0, depth = (co + 1) / 2;
      const x = Rx * s, z = Rz * co + hv * 90, y = -Ky * co + Math.sin(t * .0011 + i * 1.7) * 7;
      c.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + (s * 24).toFixed(1) + 'deg)';
      c.style.setProperty('--sh', (hv ? 1 : .5 + .5 * depth).toFixed(3));
      const bl = (hv ? 0 : Math.pow(1 - depth, 1.4) * 4.2); c.style.setProperty('--bl', bl.toFixed(2) + 'px'); c.style.setProperty('--bs', (1 + bl * .014).toFixed(3));
      c.style.zIndex = Math.round(depth * 100);
    }
  }
  // Arbejde: ringen får luft under menuen, og sektionen er kun så høj, som ringen og teksten nederst kræver (ingen stor tom plads under)
  function fitSection() {
    if (!document.body.classList.contains('work-page')) return;
    const cards = stage.querySelectorAll('.w3c'); if (!cards.length) return;
    const scene = stage.parentElement, P = parseFloat(getComputedStyle(scene).perspective) || 1700, W = innerWidth, H = innerHeight, small = W <= 900;
    const Rz = W * (small ? .32 : .3), Ky = H * (small ? .1 : .15), sF = P / (P - Rz), sB = P / (P + Rz);       // forreste kort er størst, bageste mindst
    let above = 0, below = 0; cards.forEach(c => { const h = c.offsetHeight; above = Math.max(above, Ky + h * sF / 2); below = Math.max(below, Ky + h * sB / 2); });
    const hd = document.querySelector('header'), hb = hd ? hd.getBoundingClientRect().bottom : 73;
    const center = Math.max(H * .47, 330, above + hb + 48);                                                        // kortenes top må aldrig ligge under menuen
    const foot = sec.querySelector('.w3d-foot'), footH = foot ? foot.offsetHeight : 0, footB = foot ? (parseFloat(getComputedStyle(foot).bottom) || 40) : 0;
    sec.style.setProperty('--rc', Math.round(center) + 'px');
    sec.style.minHeight = Math.ceil(center + below + 64 + footH + footB) + 'px';
  }
  const fitAll = () => { fitSection(); layout(performance.now()); };
  window.__w3Layout = () => { fitSection(); layout(performance.now()); };
  addEventListener('load', fitAll); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  function frame(t) {
    raf = 0; if (!vis) return;
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    let any = false; for (const c of stage.querySelectorAll('.w3c')) if (held(c)) { any = true; break; }
    speed += ((any ? 0 : 1) - speed) * Math.min(1, dt * 4);                       // ringen bremser op, når man peger på et kort
    auto += TAU / 85 * speed * dt;                                                 // en hel omgang tager ca. 85 sekunder
    layout(t);
    raf = requestAnimationFrame(frame);
  }
  fitSection(); layout(0);
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(() => { const small = innerWidth <= 900; if (stage.querySelectorAll('.w3c').length !== (small ? 6 : 9)) window.__w3Rebuild(); else { fitSection(); layout(performance.now()); } }, 120); });
  if (reduce) { addEventListener('scroll', () => layout(0), { passive: true }); return; }
  const start = () => { if (!raf && vis && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(es => { vis = es[0].isIntersecting; start(); }, { threshold: 0 }).observe(sec);
  document.addEventListener('visibilitychange', start);
})();

/* burst-avoid: i "Seneste projekt" flyttes billederne, så de aldrig lander oven på teksten (projektnavn m.m.) */
(function () {
  const stages = [...document.querySelectorAll('.burst-stage')]; if (!stages.length) return;
  const fit = () => stages.forEach(st => {
    const copy = st.querySelector('.burst-copy'); if (!copy) return;
    const cs = getComputedStyle(st), k = parseFloat(cs.getPropertyValue('--k')) || 1, vw = innerWidth / 100, vh = innerHeight / 100, m = 22;
    const cr = { l: copy.offsetLeft - m, t: copy.offsetTop - m, r: copy.offsetLeft + copy.offsetWidth + m, b: copy.offsetTop + copy.offsetHeight + m };
    st.querySelectorAll('.shard').forEach(sh => {
      if (sh.dataset.x === undefined) { sh.dataset.x = parseFloat(sh.style.getPropertyValue('--x')); sh.dataset.y = parseFloat(sh.style.getPropertyValue('--y')); }
      let x = +sh.dataset.x, y = +sh.dataset.y;
      sh.style.setProperty('--x', x + 'vw'); sh.style.setProperty('--y', y + 'vh');
      const ar = (sh.style.getPropertyValue('--a') || '3/4').split('/').map(Number), w = parseFloat(sh.style.getPropertyValue('--w')) * vw, h = w * ar[1] / ar[0], hw = w * .56, hh = h * .56;   // slutstørrelsen
      const cx = sh.offsetLeft + x * vw * k, cy = sh.offsetTop + y * vh * k;
      const hit = cx + hw > cr.l && cx - hw < cr.r && cy + hh > cr.t && cy - hh < cr.b;
      if (!hit) return;
      const upY = cr.t - hh;                                     // ét: skub billedet op over teksten
      if (upY - hh > -h * .35) y = (upY - sh.offsetTop) / (vh * k);
      else x = (cr.r + hw - sh.offsetLeft) / (vw * k);           // ellers: skub det til højre for teksten
      sh.style.setProperty('--x', x.toFixed(2) + 'vw'); sh.style.setProperty('--y', y.toFixed(2) + 'vh');
    });
  });
  fit(); addEventListener('resize', () => { clearTimeout(fit.t); fit.t = setTimeout(fit, 150); }); addEventListener('load', fit); setTimeout(fit, 600);
})();
