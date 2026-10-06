/* BK Studio — modernisering: bygger de små ekstra elementer, som modern.css styler.
   - "(01) Ydelser"-etiketter over sektionerne på forsiden
   - status ("Ledige til nye opgaver") og lokal tid i åbningen; de følger "Scroll ned" og forsvinder, når man scroller
   - numre på ydelseskortene
   - kæmpe ordmærke, status og lokal tid i bunden af footeren på alle sider
   Teksterne er på dansk og oversættes af i18n.js som resten af siden. */
(function () {
  'use strict';

  function clockText() {
    try { return new Intl.DateTimeFormat('da-DK', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' }).format(new Date()).replace('.', ':'); }
    catch (e) { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  }
  function el(tag, cls, html) { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  const clocks = [];
  function clock() { const t = el('time', 'm-clock', clockText()); clocks.push(t); return t; }

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

  // åbningen: status og tid, som følger "Scroll ned"-teksten (thru.js styrer dens synlighed)
  const thru = document.getElementById('thru'), hint = thru && thru.querySelector('.thru-scroll');
  if (thru && !thru.querySelector('.thru-meta')) {
    const meta = el('div', 'thru-meta'); meta.setAttribute('aria-hidden', 'true');
    const a = el('span'); a.appendChild(el('i', 'm-dot')); a.appendChild(el('span', null, 'Ledige til nye opgaver'));
    const b = el('span'); b.appendChild(el('span', null, 'Midtsjælland, DK')); b.appendChild(clock());
    meta.appendChild(a); meta.appendChild(b); thru.appendChild(meta);
    if (hint) {
      const sync = function () { meta.style.opacity = hint.style.opacity; meta.style.visibility = hint.style.opacity === '0.000' ? 'hidden' : ''; };
      new MutationObserver(sync).observe(hint, { attributes: true, attributeFilter: ['style'] }); sync();
    }
  }

  // footer: kæmpe ordmærke + status og lokal tid
  document.querySelectorAll('footer').forEach(function (f) {
    const bottom = f.querySelector('.footer-bottom'); if (!bottom || f.querySelector('.foot-mega')) return;
    const mega = el('a', 'foot-mega'); mega.href = '/'; mega.setAttribute('aria-label', 'BK Studio — til forsiden');
    mega.innerHTML = '<img class="fm-blob" src="images/logo/bk-blob.svg" alt="" loading="lazy"><img class="fm-word" src="images/logo/studio-wordmark.svg" alt="" loading="lazy">';
    const meta = el('div', 'foot-meta');
    const a = el('span'); a.appendChild(el('i', 'm-dot')); a.appendChild(el('span', null, 'Ledige til nye opgaver'));
    const b = el('span'); b.appendChild(el('span', null, 'Lokal tid i Midtsjælland')); b.appendChild(clock());
    meta.appendChild(a); meta.appendChild(b);
    f.insertBefore(mega, bottom); f.insertBefore(meta, bottom);
  });

  if (clocks.length) setInterval(function () { const t = clockText(); clocks.forEach(function (c) { if (c.textContent !== t) c.textContent = t; }); }, 15000);
})();
