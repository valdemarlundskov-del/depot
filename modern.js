/* BK Studio — modernisering: bygger de små ekstra elementer, som modern.css styler.
   - "(01) Ydelser"-etiketter over sektionerne på forsiden
   - ledig/optaget ud fra åbningstiderne + lokal tid: i headeren, ved kontaktoplysningerne (med ugens tider) og i footeren
   - numre på ydelseskortene
   - kæmpe ordmærke i bunden af footeren på alle sider
   Teksterne er på dansk og oversættes af i18n.js som resten af siden. */
(function () {
  'use strict';

  // på engelsk vises klokkeslæt med AM/PM (8:43 PM), på dansk som 20:43
  const EN = window.BK_LANG === 'en';
  function clockText() {
    try {
      return EN ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Europe/Copenhagen' }).format(new Date())
        : new Intl.DateTimeFormat('da-DK', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' }).format(new Date()).replace('.', ':');
    } catch (e) { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }
  function el(tag, cls, html) { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  // sektionsetiketter på forsiden
  [['#ydelser .head-title', 'Ydelser'], ['#proces .head-title', 'Proces'], ['#team .head-title', 'Teamet'], ['#kontakt .ct-copy', 'Kontakt']].forEach(function (s, i) {
    const host = document.querySelector(s[0]); if (!host || host.querySelector('.m-idx')) return;
    const p = el('p', 'm-idx'); p.setAttribute('aria-hidden', 'true');
    p.appendChild(el('b', null, '(' + String(i + 1).padStart(2, '0') + ')'));
    p.appendChild(el('span', null, s[1]));
    host.insertBefore(p, host.firstChild);
  });

  // numre på ydelseskortene
  document.querySelectorAll('.svc-row3 .sv').forEach(function (sv, i) {
    const img = sv.querySelector('.sv-img:not(.sv-mark)'); if (!img || img.querySelector('.sv-num')) return;
    const n = el('span', 'sv-num', String(i + 1).padStart(2, '0')); n.setAttribute('aria-hidden', 'true'); img.appendChild(n);
  });

  // ledig/optaget ud fra åbningstiderne (dansk tid). Søndag = 0.
  const HOURS = [[10, 17], [8, 20], [8, 20], [8, 20], [8, 20], [8, 20], [10, 17]];
  const DAYS = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
  const p2 = n => String(n).padStart(2, '0');
  const hh = h => EN ? ((h % 12) || 12) + ' ' + (h < 12 ? 'AM' : 'PM') : p2(h);       // et helt klokkeslæt: 20 / 8 PM
  function nowCph() {
    try {
      const parts = {}; new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Copenhagen' }).formatToParts(new Date()).forEach(x => { parts[x.type] = x.value; });
      return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), m: (+parts.hour) * 60 + (+parts.minute) };
    } catch (e) { const t = new Date(); return { d: t.getDay(), m: t.getHours() * 60 + t.getMinutes() }; }
  }
  function status() {
    const n = nowCph(), h = HOURS[n.d];
    if (n.m >= h[0] * 60 && n.m < h[1] * 60) return { open: true, day: n.d, main: 'Ledige nu', sub: EN ? 'Available until ' + hh(h[1]) : 'Ledige til kl. ' + hh(h[1]) };
    if (n.m < h[0] * 60) return { open: false, day: n.d, main: 'Optaget lige nu', sub: EN ? 'Back today at ' + hh(h[0]) : 'Tilbage i dag kl. ' + hh(h[0]) };
    const o = HOURS[(n.d + 1) % 7][0];
    return { open: false, day: n.d, main: 'Optaget lige nu', sub: EN ? 'Back tomorrow at ' + hh(o) : 'Tilbage i morgen kl. ' + hh(o) };
  }
  // tekster, der skifter med tiden: den danske udgave huskes, så oversættelsen (i18n.js) ikke får dem til at blive sat igen og igen
  const live = [];
  function liveText(cls, key) { const s = el('span', cls); s.dataset.key = key; live.push(s); return s; }
  function dot() { const i = el('i', 'm-dot'); live.push(i); return i; }
  function refresh() {
    const st = status(), t = clockText();
    live.forEach(function (n) {
      if (n.classList.contains('m-dot')) { n.classList.toggle('off', !st.open); return; }
      const v = n.dataset.key === 'clock' ? t : st[n.dataset.key];
      if (n.dataset.da !== v) { n.dataset.da = v; n.textContent = v; }
    });
    document.querySelectorAll('.hours li').forEach(function (li) { li.classList.toggle('today', +li.dataset.d === st.day); });
  }

  // headeren: status og lokal tid på alle sider (computer)
  const hr = document.querySelector('.site-header .header-right'), lang = hr && hr.querySelector('.lang');
  if (hr && !hr.querySelector('.hdr-status')) {
    const hs = el('div', 'hdr-status');
    hs.appendChild(dot()); hs.appendChild(liveText('hs-txt', 'main'));
    hs.appendChild(el('span', 'hs-sep', '·')); hs.appendChild(liveText('m-clock', 'clock'));
    hr.insertBefore(hs, lang || hr.firstChild);
  }

  // åbningstider ved kontaktoplysningerne (forsiden og /kontakt)
  [['#kontakt .ct-copy', '.ct-lines'], ['.booking-intro', '.contact-people']].forEach(function (s) {
    const host = document.querySelector(s[0]); if (!host || host.querySelector('.hours')) return;
    const box = el('div', 'hours');
    const top = el('div', 'hours-top'); top.appendChild(el('span', 'hours-lab', 'Åbningstider'));
    const now = el('span', 'hours-now'); now.appendChild(dot()); now.appendChild(liveText(null, 'main'));
    top.appendChild(now); box.appendChild(top);
    const sub = liveText('hours-sub', 'sub'); box.appendChild(sub);
    const ul = el('ul');
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      const li = el('li'); li.dataset.d = d;
      li.appendChild(el('span', null, DAYS[d])); li.appendChild(el('span', 'hours-t', hh(HOURS[d][0]) + '–' + hh(HOURS[d][1])));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    const after = host.querySelector(s[1]);
    if (after) after.after(box); else host.appendChild(box);
  });

  // footer: kæmpe ordmærke + status og lokal tid
  document.querySelectorAll('footer').forEach(function (f) {
    const bottom = f.querySelector('.footer-bottom'); if (!bottom || f.querySelector('.foot-mega')) return;
    const mega = el('a', 'foot-mega'); mega.href = '/'; mega.setAttribute('aria-label', 'BK Studio — til forsiden');
    mega.innerHTML = '<img class="fm-blob" src="images/logo/bk-blob.svg" alt="" loading="lazy"><img class="fm-word" src="images/logo/studio-wordmark.svg" alt="" loading="lazy">';
    const meta = el('div', 'foot-meta');
    const a = el('span'); a.appendChild(dot()); a.appendChild(liveText(null, 'main')); a.appendChild(el('span', 'hs-sep', '·')); a.appendChild(liveText(null, 'sub'));
    const b = el('span'); b.appendChild(el('span', null, 'Lokal tid i Danmark')); b.appendChild(liveText('m-clock', 'clock'));
    meta.appendChild(a); meta.appendChild(b);
    f.insertBefore(meta, bottom); f.insertBefore(mega, bottom);   // status og lokal tid over det store logo
  });

  refresh(); setInterval(refresh, 15000);

  // 3D-logoet: three.js (logo3d.min.js) hentes først, når logoet nærmer sig skærmen
  const l3 = document.querySelectorAll('.logo3d');
  if (l3.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (es) { if (es.some(e => e.isIntersecting)) { io.disconnect(); import('/logo3d.min.js').catch(function () { l3.forEach(n => n.classList.add('logo3d-fallback')); }); } }, { rootMargin: '600px 0px' });
    l3.forEach(n => io.observe(n));
  }
})();
