/* BK Studio — al adfærd på siden. Bygges til assets/bk.js med esbuild (se tools/README.md).
   Blød scroll (Lenis), header der skifter farve og bliver mindre, mobilmenu, cursor (BK-logoet, der bliver til VIS / TRÆK / AFSPIL),
   animationer ved scroll, parallax, forsidens sektioner (hero, udsagn, historier, galleri, ydelser, proces, stifterne), filmstrimmel,
   filtre og lysboks, sideskift, åbningstider/status og formularerne (kontakt og booking → /api/send-mail).
   Alt respekterer "reducer bevægelse", og på mobil er effekterne forenklet. */
import Lenis from 'lenis';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const narrow = () => innerWidth <= 900;
const EN = window.BK_LANG === 'en';
const root = document.documentElement;

/* ---------- én fælles frame-løkke ---------- */
const ticks = [];
let lenis = null, vh = innerHeight, vw = innerWidth, sy = scrollY;
if (!reduce && fine) {
  lenis = new Lenis({ lerp: .095, wheelMultiplier: .95, smoothWheel: true });
  window.lenis = lenis;
}
function loop(t) {
  if (lenis) lenis.raf(t);
  sy = lenis ? lenis.scroll : scrollY;
  for (const f of ticks) f(sy, t);
  requestAnimationFrame(loop);
}
addEventListener('resize', () => { vh = innerHeight; vw = innerWidth; });
requestAnimationFrame(loop);
const rect = el => el.getBoundingClientRect();

/* ankerlinks scroller blødt */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href*="#"]'); if (!a) return;
  const u = new URL(a.href, location.href);
  if (u.pathname !== location.pathname || !u.hash) return;
  const t = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (!t) return;
  e.preventDefault(); closeMenu();
  if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.4 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  history.replaceState(null, '', u.hash);
});

/* ---------- header: farve efter sektionen bag den, mindre ved scroll, skjules ved scroll ned ---------- */
const hd = $('.hd');
const themed = $$('[data-theme]');
let lastY = 0, hidden = false;
function headerTick(y) {
  if (!hd) return;
  const probe = 34;
  let on = hd.dataset.on;
  for (const s of themed) { const r = rect(s); if (r.top <= probe && r.bottom > probe) { on = s.dataset.theme; break; } }
  if (on !== hd.dataset.on) hd.dataset.on = on;
  hd.classList.toggle('is-compact', y > 40);
  const dy = y - lastY;
  if (Math.abs(dy) > 4) {
    const h = dy > 0 && y > vh * .6 && !document.body.classList.contains('menu-open');
    if (h !== hidden) { hidden = h; hd.classList.toggle('is-hidden', h); }
    lastY = y;
  }
}
ticks.push(headerTick);

/* mobilmenu */
const menuBtn = $('.hd-menu');
function closeMenu() { document.body.classList.remove('menu-open'); if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false'); if (lenis) lenis.start(); }
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open));
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}

/* ---------- cursor ---------- */
const cur = $('.cursor');
if (cur && fine && !reduce) {
  root.classList.add('has-cursor');
  const lab = $('.c-ring', cur);
  let x = vw / 2, y = vh / 2, tx = x, ty = y, seen = false;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; if (!seen) { seen = true; x = tx; y = ty; cur.style.opacity = 1; } }, { passive: true });
  document.addEventListener('pointerleave', () => { cur.style.opacity = 0; seen = false; });
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.addEventListener('pointerover', e => {
    const c = e.target.closest('[data-cursor]');
    if (c) { lab.textContent = c.dataset.cursor; cur.classList.add('is-label'); cur.classList.remove('is-link'); return; }
    cur.classList.remove('is-label');
    cur.classList.toggle('is-link', !!e.target.closest('a,button,summary,label,[role=button]'));
  });
  ticks.push(() => {
    x += (tx - x) * .28; y += (ty - y) * .28;
    cur.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
  });
}

/* ---------- tekst deles i ord, så den kan glide op linje for linje ---------- */
$$('.split').forEach(el => {
  if (el.dataset.done) return; el.dataset.done = 1;
  let i = 0;
  const walk = n => {
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const parts = c.textContent.split(/(\s+)/), f = document.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(p)); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
          w.appendChild(s); f.appendChild(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
    });
  };
  el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  walk(el);
  $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
});

/* ---------- vis ved scroll ---------- */
const revealSel = '[data-reveal],.split:not(.split-manual),.img-rv,.label-row';
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$(revealSel).forEach(el => io.observe(el));
} else $$(revealSel).forEach(el => el.classList.add('in'));

/* ---------- parallax: data-parallax="0.15" (positiv = langsommere end siden) ---------- */
const pars = $$('[data-parallax]').map(el => ({ el, k: parseFloat(el.dataset.parallax) || .1 }));
if (pars.length && !reduce) ticks.push(() => {
  const m = narrow() ? .45 : 1;
  for (const p of pars) {
    const r = rect(p.el.parentElement || p.el); if (r.bottom < -200 || r.top > vh + 200) continue;
    const off = (r.top + r.height / 2 - vh / 2) * p.k * m;
    p.el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
  }
});

/* ===================================================================== FORSIDEN ===================================================================== */

/* hero: showreel, let dybde med musen og ved scroll */
const hero = $('.hero');
if (hero) {
  const media = $('.hero-media', hero), word = $('.hero-word span', hero), inner = $('.hero-in', hero), vid = $('video', hero);
  if (vid) {
    const sd = navigator.connection && navigator.connection.saveData;
    if (reduce || sd) { vid.removeAttribute('autoplay'); vid.preload = 'none'; }
    else {
      const small = narrow();
      $$('source', vid).forEach(s => { s.src = s.dataset[small ? 'sm' : 'lg']; });
      vid.load(); vid.play().catch(() => {});
      new IntersectionObserver(es => { es[0].isIntersecting ? vid.play().catch(() => {}) : vid.pause(); }).observe(hero);
    }
  }
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (fine && !reduce) hero.addEventListener('pointermove', e => { tmx = e.clientX / vw - .5; tmy = e.clientY / vh - .5; });
  if (!reduce) ticks.push(y => {
    if (y > vh * 1.2) return;
    mx += (tmx - mx) * .06; my += (tmy - my) * .06;
    const p = clamp(y / vh);
    media.style.transform = 'translate3d(' + (mx * -22).toFixed(1) + 'px,' + (y * .32 + my * -16).toFixed(1) + 'px,0) scale(' + (1 + p * .08).toFixed(4) + ')';
    if (word) word.style.transform = 'translate3d(' + (mx * 18).toFixed(1) + 'px,' + (12 - p * 30).toFixed(2) + '%,0)';
    if (inner) inner.style.opacity = (1 - smooth(p * 1.35)).toFixed(3);
  });
}

/* stort udsagn: linjerne glider hver sin vej */
$$('.statement').forEach(sec => {
  const lines = $$('.line', sec); if (reduce) return;
  ticks.push(() => {
    const r = rect(sec); if (r.bottom < 0 || r.top > vh) return;
    const p = (vh - r.top) / (vh + r.height);
    lines.forEach((l, i) => { const d = (i % 2 ? 1 : -1) * (p - .5) * vw * .28; l.style.transform = 'translate3d(' + d.toFixed(1) + 'px,0,0)'; });
  });
});

/* historier: billedet glider op over det forrige, teksten skifter */
$$('.stories').forEach(sec => {
  const track = $('.stories-track', sec), imgs = $$('.story-img', sec), txts = $$('.story-txt', sec), n = imgs.length;
  const bar = $('.stories-bar', sec), cnt = $('.stories-n', sec);
  track.style.setProperty('--n', n);
  let act = -1;
  const set = i => {
    if (i === act) return; act = i;
    txts.forEach((t, k) => { t.classList.toggle('on', k === i); $$('.split', t).forEach(s => s.classList.toggle('in', k === i)); });
    if (cnt) cnt.textContent = String(i + 1).padStart(2, '0');
  };
  set(0);
  ticks.push(() => {
    const r = rect(track); if (r.bottom < 0 || r.top > vh) return;
    const p = clamp(-r.top / Math.max(1, r.height - vh)) * (n - 1 + .35);
    imgs.forEach((im, i) => {
      const img = im.firstElementChild;
      if (i > 0) { const q = reduce ? (p >= i - .5 ? 1 : 0) : smooth(clamp(p - (i - 1) - .15, 0, .85) / .85); im.style.clipPath = 'inset(' + ((1 - q) * 100).toFixed(2) + '% 0 0 0)'; }
      const local = clamp(p - i + 1, 0, 2);
      if (img && !reduce) img.style.transform = 'scale(' + (1.12 - .1 * smooth(local / 1.4)).toFixed(4) + ') translateY(' + ((local - 1) * -3).toFixed(2) + '%)';
    });
    set(Math.min(n - 1, Math.round(clamp(p - .15, 0, n - 1))));
    if (bar) bar.style.setProperty('--p', clamp(p / (n - 1 + .35)).toFixed(4));
  });
});

/* vandret galleri: følger scroll på computer (og kan trækkes); swipes på mobil */
$$('.hgal').forEach(sec => {
  const pin = $('.hgal-pin', sec), track = $('.hgal-track', sec);
  let dist = 0;
  const measure = () => {
    if (narrow()) { pin.style.removeProperty('--h'); track.style.transform = ''; return; }
    dist = Math.max(0, track.scrollWidth - vw);
    pin.style.setProperty('--h', (dist + vh) + 'px');
  };
  measure(); addEventListener('resize', measure); addEventListener('load', measure);
  ticks.push(() => {
    if (narrow() || reduce) return;
    const r = rect(pin); if (r.bottom < 0 || r.top > vh) return;
    const p = clamp(-r.top / Math.max(1, r.height - vh));
    track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
  });
  // træk med musen: flytter siden tilsvarende
  if (fine) {
    let sx = null, start = 0;
    track.addEventListener('pointerdown', e => { if (narrow()) return; sx = e.clientX; start = sy; track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointermove', e => {
      if (sx === null) return;
      const dx = e.clientX - sx; if (Math.abs(dx) > 6) track.dataset.dragged = 1;
      const to = start - dx * ((pin.offsetHeight - vh) / Math.max(1, dist));
      lenis ? lenis.scrollTo(to, { immediate: true }) : scrollTo(0, to);
    });
    const end = () => { sx = null; setTimeout(() => { delete track.dataset.dragged; }, 0); };
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    track.addEventListener('click', e => { if (track.dataset.dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
});

/* ydelser: billede/video, der følger musen, og baggrund efter det valgte punkt */
$$('.svc').forEach(sec => {
  const rows = $$('.svc-row', sec), prev = $('.svc-prev', sec), items = prev ? [...prev.children] : [], bgs = $$('.svc-bg div', sec);
  let x = 0, y = 0, tx = 0, ty = 0, on = -1;
  const show = i => {
    if (i === on) return; on = i;
    items.forEach((m, k) => { m.classList.toggle('on', k === i); if (m.tagName === 'VIDEO') { k === i ? m.play().catch(() => {}) : m.pause(); } });
    bgs.forEach((b, k) => b.classList.toggle('on', k === i));
    if (prev) prev.classList.toggle('on', i >= 0);
  };
  rows.forEach((r, i) => { r.addEventListener('pointerenter', () => show(i)); r.addEventListener('focusin', () => show(i)); });
  $('.svc-list', sec).addEventListener('pointerleave', () => show(-1));
  if (prev && fine) {
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    ticks.push(() => { if (on < 0) { x = tx; y = ty; return; } x += (tx - x) * .14; y += (ty - y) * .14; prev.style.left = x + 'px'; prev.style.top = y + 'px'; });
  }
});

/* proces: stregen fyldes, og trinnene tændes efterhånden */
$$('.proc').forEach(sec => {
  const steps = $$('.proc-step', sec), line = $('.proc-line', sec), cnt = $('.proc-count b', sec), list = $('.proc-steps', sec);
  ticks.push(() => {
    const r = rect(list); if (r.bottom < -100 || r.top > vh + 100) return;
    const p = clamp((vh * .62 - r.top) / r.height);
    if (line) line.style.setProperty('--p', p.toFixed(4));
    let a = 0;
    steps.forEach((s, i) => { const on = rect(s).top < vh * .62; s.classList.toggle('on', on); if (on) a = i; });
    if (cnt) { const v = String(a + 1).padStart(2, '0'); if (cnt.textContent !== v) cnt.textContent = v; }
  });
});

/* stifterne: let 3D-hældning og glans ved hover */
if (fine && !reduce) $$('.founder').forEach(f => {
  const t = $('.tilt', f), ph = $('.ph', f); if (!t) return;
  f.addEventListener('pointermove', e => {
    const r = rect(f), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    t.style.transform = 'rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg)';
    if (ph) { ph.style.setProperty('--gx', ((x + .5) * 100).toFixed(1) + '%'); ph.style.setProperty('--gy', ((y + .5) * 100).toFixed(1) + '%'); }
  });
  f.addEventListener('pointerleave', () => { t.style.transform = ''; });
});

/* filmstrimmel: kan trækkes med efterløb (mobil: almindelig swipe) */
$$('.strip').forEach(st => {
  const tr = $('.strip-track', st); if (!tr || !fine) return;
  let x = 0, v = 0, sx = null, lx = 0, max = 0;
  const m = () => { max = Math.max(0, tr.scrollWidth - st.clientWidth); };
  m(); addEventListener('resize', m); addEventListener('load', m);
  tr.addEventListener('pointerdown', e => { sx = e.clientX; lx = e.clientX; v = 0; tr.classList.add('drag'); tr.setPointerCapture(e.pointerId); });
  tr.addEventListener('pointermove', e => { if (sx === null) return; const d = e.clientX - lx; lx = e.clientX; x -= d; v = -d; if (Math.abs(e.clientX - sx) > 6) tr.dataset.dragged = 1; });
  const up = () => { sx = null; tr.classList.remove('drag'); setTimeout(() => { delete tr.dataset.dragged; }, 0); };
  tr.addEventListener('pointerup', up); tr.addEventListener('pointercancel', up);
  tr.addEventListener('click', e => { if (tr.dataset.dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  ticks.push(() => {
    if (sx === null) { x += v; v *= .92; }
    if (x < 0) { x += (0 - x) * .2; v = 0; } if (x > max) { x += (max - x) * .2; v = 0; }
    tr.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
  });
});

/* ===================================================================== UNDERSIDER ===================================================================== */

/* filtre (arbejde og arkiv): knapper med data-filter, elementer med data-tags */
$$('[data-filters]').forEach(box => {
  const scope = document.querySelector(box.dataset.filters), items = scope ? $$('[data-tags]', scope) : [];
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]'); if (!b) return;
    $$('[data-filter]', box).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const f = b.dataset.filter;
    items.forEach(it => it.classList.toggle('hide', f !== '*' && !it.dataset.tags.split('|').includes(f)));
    if (lenis) lenis.resize();
  });
});

/* gamle links: /arbejde#vildbjerg → /arbejde/vildbjerg */
if (/^\/arbejde\/?$/.test(location.pathname.replace(/\.html$/, '')) && location.hash) {
  const id = location.hash.slice(1);
  if ($('[data-work="' + CSS.escape(id) + '"]')) location.replace('/arbejde/' + id);
}

/* lysboks (arkiv og projektsider): links med data-lb åbner billedet stort; piletaster og swipe skifter */
const lbLinks = $$('[data-lb]');
if (lbLinks.length) {
  const lb = document.createElement('div'); lb.className = 'lb t-ink'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Billede');
  lb.innerHTML = '<div class="lb-top"><span class="label lb-cap"></span><button type="button" class="lb-x">Luk ✕</button></div><div class="lb-fig"><img alt=""></div><div class="lb-bot"><button type="button" class="lb-p">← Forrige</button><span class="label num lb-n"></span><button type="button" class="lb-nx">Næste →</button></div>';
  document.body.appendChild(lb);
  const img = $('img', lb); let idx = 0, back = null;
  const vis = () => lbLinks.filter(a => !a.closest('.hide'));
  const show = i => {
    const list = vis(); idx = (i + list.length) % list.length; const a = list[idx];
    img.src = a.getAttribute('href'); img.alt = a.dataset.alt || '';
    $('.lb-cap', lb).textContent = a.dataset.cap || ''; $('.lb-n', lb).textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0');
  };
  const open = a => { back = a; show(vis().indexOf(a)); lb.classList.add('on'); if (lenis) lenis.stop(); $('.lb-x', lb).focus(); };
  const close = () => { lb.classList.remove('on'); if (lenis) lenis.start(); if (back) back.focus(); };
  lbLinks.forEach(a => a.addEventListener('click', e => { if (a.closest('[data-dragged]')) return; e.preventDefault(); open(a); }));
  $('.lb-x', lb).addEventListener('click', close);
  $('.lb-p', lb).addEventListener('click', () => show(idx - 1));
  $('.lb-nx', lb).addEventListener('click', () => show(idx + 1));
  addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  let tx0 = null;
  lb.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (tx0 === null) return; const d = e.changedTouches[0].clientX - tx0; if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1)); tx0 = null; });
}

/* ===================================================================== FÆLLES ===================================================================== */

/* åbningstider og status (dansk tid). Søndag = 0. På engelsk vises klokkeslæt med AM/PM. */
const HOURS = [[10, 17], [8, 20], [8, 20], [8, 20], [8, 20], [8, 20], [10, 17]];
const p2 = n => String(n).padStart(2, '0');
const hh = h => EN ? ((h % 12) || 12) + ' ' + (h < 12 ? 'AM' : 'PM') : p2(h);
function nowCph() {
  try {
    const o = {}; new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Copenhagen' }).formatToParts(new Date()).forEach(x => { o[x.type] = x.value; });
    return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), m: (+o.hour) * 60 + (+o.minute) };
  } catch (e) { const t = new Date(); return { d: t.getDay(), m: t.getHours() * 60 + t.getMinutes() }; }
}
function clockText() {
  try {
    return EN ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Europe/Copenhagen' }).format(new Date())
      : new Intl.DateTimeFormat('da-DK', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' }).format(new Date()).replace('.', ':');
  } catch (e) { return ''; }
}
function status() {
  const n = nowCph(), h = HOURS[n.d];
  if (n.m >= h[0] * 60 && n.m < h[1] * 60) return { open: true, d: n.d, main: EN ? 'Available now' : 'Ledige nu', sub: EN ? 'Until ' + hh(h[1]) : 'Til kl. ' + hh(h[1]) };
  const back = n.m < h[0] * 60 ? (EN ? 'Back today at ' : 'Tilbage i dag kl. ') + hh(h[0]) : (EN ? 'Back tomorrow at ' : 'Tilbage i morgen kl. ') + hh(HOURS[(n.d + 1) % 7][0]);
  return { open: false, d: n.d, main: EN ? 'Busy right now' : 'Optaget lige nu', sub: back };
}
$$('[data-hours]').forEach(ul => {
  const days = EN ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] : ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
  ul.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => '<li data-d="' + d + '"><span>' + days[d] + '</span><span class="num">' + hh(HOURS[d][0]) + '–' + hh(HOURS[d][1]) + '</span></li>').join('');
});
function refreshStatus() {
  const st = status(), c = clockText();
  $$('[data-status]').forEach(el => {
    const k = el.dataset.status;
    if (k === 'dot') el.classList.toggle('off', !st.open);
    else { const v = k === 'clock' ? c : st[k]; if (el.dataset.v !== v) { el.dataset.v = v; el.textContent = v; } }
  });
  $$('[data-hours] li').forEach(li => li.classList.toggle('today', +li.dataset.d === st.d));
}
refreshStatus(); setInterval(refreshStatus, 20000);

/* 3D-logoet hentes først, når det nærmer sig skærmen */
const l3 = $$('.logo3d');
if (l3.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); import('/assets/logo3d.js').catch(() => l3.forEach(n => n.classList.add('logo3d-fallback'))); } }, { rootMargin: '500px 0px' });
  l3.forEach(n => io.observe(n));
}

/* sprogknapper: håndteres af i18n.js (klik), her markeres kun det aktive */
$$('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === (window.BK_LANG || 'da')));

/* ---------- sideskift: et kort tæppe ned og op ---------- */
(function () {
  if (reduce) return;
  const pt = $('.pt'); if (!pt) return;
  if (root.classList.contains('pt-in')) {
    requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add('pt-entering'); root.classList.remove('pt-in'); setTimeout(() => root.classList.remove('pt-entering'), 800); }));
  }
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]'); if (!a || a.target || a.hasAttribute('download') || a.dataset.lb !== undefined) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || /^(mailto|tel):/.test(a.getAttribute('href'))) return;
    if (u.pathname === location.pathname && u.search === location.search) return;            // ankre på samme side
    if (/\.(pdf|jpe?g|png|webp|mp4|webm|zip)$/i.test(u.pathname)) return;
    e.preventDefault();
    try { sessionStorage.setItem('bk-pt', '1'); } catch (err) {}
    root.classList.add('pt-leaving');
    setTimeout(() => { location.href = a.href; }, 520);
  });
  addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('pt-leaving', 'pt-in', 'pt-entering'); });
})();

/* ===================================================================== FORMULARER ===================================================================== */
const MAIL_ENDPOINT = '/api/send-mail';
const MAIL_ERROR_TEXT = 'Beskeden kunne ikke sendes lige nu. Prøv igen om lidt, eller skriv direkte til kontakt@bkstudio.dk.';
function sendMail(data) {
  const body = new URLSearchParams(); for (const [k, v] of data.entries()) body.append(k, v);
  return fetch(MAIL_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body })
    .then(res => res.text().then(raw => { let json; try { json = JSON.parse(raw); } catch (e) { json = { success: false, message: '' }; } return { res, json }; }))
    .then(r => {
      const msg = (r.json && r.json.message) || '';
      if (!(r.res.ok && r.json && r.json.success) && !/^(Udfyld|Ugyldig|For mange)/.test(msg)) {
        console.error('/api/send-mail fejlede — HTTP ' + r.res.status + ': ' + msg.slice(0, 300));
        r.json = { success: false, message: MAIL_ERROR_TEXT };
      }
      return r;
    })
    .catch(err => { console.error('Kunne ikke nå /api/send-mail:', err); return { res: { ok: false, status: 0 }, json: { success: false, message: MAIL_ERROR_TEXT } }; });
}
function setStatus(el, text, kind) { if (!el) return; el.textContent = text; el.classList.remove('is-success', 'is-error'); if (kind) el.classList.add(kind === 'success' ? 'is-success' : 'is-error'); }
// felter med svævende etiket
$$('.field input,.field textarea,.field select').forEach(i => { const f = () => i.closest('.field').classList.toggle('filled', !!i.value); i.addEventListener('input', f); i.addEventListener('change', f); f(); });

const contactForm = $('#contactForm');
if (contactForm) {
  const st = $('#contactStatus');
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(contactForm);
    if ((data.get('website') || '').toString().trim() !== '') { contactForm.reset(); return; }                // honningkrukke mod robotter
    const btn = $('button[type="submit"]', contactForm), lbl = btn && $('span', btn), orig = lbl ? lbl.textContent : '';
    if (btn) btn.disabled = true; if (lbl) lbl.textContent = 'Sender…'; setStatus(st, '');
    data.append('form_type', 'kontakt'); data.append('lang', window.BK_LANG || 'da'); data.delete('website');
    sendMail(data).then(({ res, json }) => {
      if (res.ok && json.success) { setStatus(st, 'Tak! Din besked er sendt — vi vender tilbage hurtigst muligt.', 'success'); contactForm.reset(); $$('.field', contactForm).forEach(f => f.classList.remove('filled')); }
      else setStatus(st, json.message || 'Beskeden kunne ikke sendes. Prøv igen senere.', 'error');
    }).finally(() => { if (lbl) lbl.textContent = orig; if (btn) btn.disabled = false; });
  });
}

const bookingForm = $('#bookingForm');
if (bookingForm) {
  const panes = $$('.wizard-pane', bookingForm), backBtn = $('#wizardBack'), nextBtn = $('#wizardNext'), submitBtn = $('#wizardSubmit');
  const summary = $('#wizardSummary'), st = $('#bookStatus'), num = $('#wizardStepNum'), tot = $('#wizardStepTotal'), dashes = $$('.wiz-dash');
  let cur = 1; const total = panes.length; if (tot) tot.textContent = String(total).padStart(2, '0');
  const req = n => $$('input[required], textarea[required], select[required]', panes[n - 1]);
  const valid = n => { const seen = new Set(); return req(n).every(f => { if (f.type === 'radio') { if (seen.has(f.name)) return true; seen.add(f.name); return $$('input[name="' + f.name + '"]', panes[n - 1]).some(r => r.checked); } return f.value.trim() !== '' && (!f.checkValidity || f.checkValidity()); }); };
  const allValid = () => { for (let i = 1; i <= total; i++) if (!valid(i)) return false; return true; };
  const states = () => { nextBtn.disabled = !valid(cur); submitBtn.disabled = !(valid(cur) && allValid()); };
  const render = () => {
    if (!summary) return; const d = new FormData(bookingForm);
    const rows = [['Behov', 'behov'], ['Opgave', 'opgave'], ['Tidsramme', 'tidsramme'], ['Budget', 'budget'], ['Navn', 'navn'], ['E-mail', 'email'], ['Telefon', 'telefon'], ['Virksomhed', 'virksomhed']]
      .map(([l, k]) => [l, (d.get(k) || '').toString().trim()]).filter(r => r[1]);
    summary.innerHTML = '';
    rows.forEach(([l, v]) => { const r = document.createElement('div'); r.className = 'wizard-summary-row'; const a = document.createElement('span'); a.textContent = l; const b = document.createElement('span'); b.textContent = v.length > 70 ? v.slice(0, 70) + '…' : v; r.append(a, b); summary.appendChild(r); });
  };
  const go = n => {
    cur = clamp(n, 1, total); panes.forEach((p, i) => p.classList.toggle('active', i === cur - 1));
    if (num) num.textContent = String(cur).padStart(2, '0'); dashes.forEach((d, i) => d.classList.toggle('done', i < cur));
    backBtn.hidden = cur === 1; nextBtn.hidden = cur === total; submitBtn.hidden = cur !== total;
    if (cur === total) render(); setStatus(st, ''); states();
  };
  nextBtn.addEventListener('click', () => { if (!valid(cur)) { const f = req(cur).find(x => x.type === 'radio' ? !$$('input[name="' + x.name + '"]', panes[cur - 1]).some(r => r.checked) : !x.value.trim() || (x.checkValidity && !x.checkValidity())); if (f) f.focus(); states(); return; } go(cur + 1); });
  backBtn.addEventListener('click', () => go(cur - 1));
  bookingForm.addEventListener('input', states); bookingForm.addEventListener('change', states);
  bookingForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!allValid()) { setStatus(st, 'Udfyld alle felter for at sende bookingen.', 'error'); states(); return; }
    const data = new FormData(bookingForm);
    if ((data.get('website') || '').toString().trim() !== '') { bookingForm.reset(); go(1); return; }
    submitBtn.disabled = true; const lbl = $('span', submitBtn), orig = lbl ? lbl.textContent : ''; if (lbl) lbl.textContent = 'Sender…'; setStatus(st, '');
    data.append('form_type', 'booking'); data.append('lang', window.BK_LANG || 'da'); data.delete('website');
    sendMail(data).then(({ res, json }) => {
      if (res.ok && json.success) { bookingForm.reset(); $$('.field', bookingForm).forEach(f => f.classList.remove('filled')); go(1); setStatus(st, 'Tak! Din forespørgsel er sendt — vi vender tilbage hurtigst muligt.', 'success'); }
      else setStatus(st, json.message || 'Bookingen kunne ikke sendes. Prøv igen senere.', 'error');
    }).finally(() => { if (lbl) lbl.textContent = orig; states(); });
  });
  go(1);
}

if (lenis) addEventListener('load', () => lenis.resize());
