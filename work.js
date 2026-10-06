/* BK Studio — Arbejde: kvalitet frem for kvantitet.
   Arkivet viser alt; her vises hvert projekt som en lille, kurateret case: ét stort hovedbillede, tre udvalgte billeder og teksten.
   Udvalget styres af `lead` og `pick` på hvert projekt i script.js. Klik åbner hele projektet i den samme visning som før (openProject). */
(function () {
  'use strict';
  const host = document.getElementById('selCases'), index = document.getElementById('selIndex');
  if (!host || typeof projects === 'undefined') return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');
  const med = src => src.replace('images/', 'images/med/'), th = src => src.replace('images/', 'images/thumbs/');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const total = pad(projects.length);

  const img = (src, alt, sizes, eager) => `<img src="${med(src)}" srcset="${th(src)} 1100w, ${med(src)} 1920w" sizes="${sizes}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.classList.add('image-error')">`;
  const shot = (p, src, cls, sizes) => `<a class="case-shot ${cls}" href="/arbejde#${p.id}" data-open="${p.id}" tabindex="-1" aria-hidden="true"><span class="case-frame">${img(src, '', sizes)}</span></a>`;

  // øverst: en rolig indholdsfortegnelse over projekterne
  if (index) index.innerHTML = projects.map((p, i) => `<li><a class="sel-row" href="#case-${p.id}" data-to="case-${p.id}">
      <span class="sel-n">${pad(i + 1)}</span><span class="sel-t">${esc(p.title)}</span><span class="sel-c">${esc(p.category)}</span><span class="sel-y">${esc(p.year)}</span><span class="sel-a" aria-hidden="true">↓</span>
    </a></li>`).join('');

  host.innerHTML = projects.map((p, i) => {
    const lead = p.lead || p.hero || p.cover;
    const pick = (p.pick && p.pick.length ? p.pick : p.gallery.filter(g => g !== lead)).slice(0, 3);
    const flip = i % 2 ? ' is-flip' : '';
    return `<article class="case${flip}" id="case-${p.id}" aria-labelledby="case-t-${p.id}">
      <header class="case-head" data-cr>
        <p class="case-n"><span>${pad(i + 1)}</span><span class="case-of">/ ${total}</span></p>
        <h2 class="case-title" id="case-t-${p.id}">${esc(p.title)}</h2>
        <dl class="case-meta">
          <div><dt>Kategori</dt><dd>${esc(p.category)}</dd></div>
          <div><dt>Sted</dt><dd>${esc(p.location || '')}</dd></div>
          <div><dt>År</dt><dd>${esc(p.year)}</dd></div>
        </dl>
      </header>
      <a class="case-lead" href="/arbejde#${p.id}" data-open="${p.id}" aria-label="Se projektet ${esc(p.title)}" data-cr>
        <span class="case-frame">${img(lead, p.title + ' — ' + p.category, '(max-width: 820px) 100vw, 92vw', i === 0)}</span>
        <span class="case-view" aria-hidden="true">Se projekt</span>
      </a>
      <div class="case-body">
        <div class="case-text" data-cr>
          <p class="case-sum">${esc(p.summary || '')}</p>
          <a class="case-link" href="/arbejde#${p.id}" data-open="${p.id}"><span>Se hele projektet</span><i aria-hidden="true">→</i></a>
          <p class="case-count">${p.gallery.length} billeder</p>
        </div>
        ${pick[0] ? shot(p, pick[0], 'case-a', '(max-width: 820px) 50vw, 26vw') : ''}
        ${pick[2] ? shot(p, pick[2], 'case-c', '(max-width: 820px) 50vw, 24vw') : ''}
        ${pick[1] ? shot(p, pick[1], 'case-b', '(max-width: 820px) 100vw, 64vw') : ''}
      </div>
    </article>`;
  }).join('');

  // klik: åbn hele projektet (samme visning som før); uden overlay følger linket bare
  host.addEventListener('click', e => {
    const a = e.target.closest('[data-open]');
    if (!a || typeof openProject !== 'function' || !document.getElementById('overlay')) return;
    e.preventDefault(); openProject(a.dataset.open);
  });
  if (index) index.addEventListener('click', e => {
    const a = e.target.closest('[data-to]'); if (!a) return;
    const el = document.getElementById(a.dataset.to); if (!el) return;
    e.preventDefault(); el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  // billeder og tekst toner ind, når de kommer frem
  const els = host.querySelectorAll('[data-cr], .case-shot');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));

  // let dybde: hovedbillederne glider en smule langsommere end siden
  if (!reduce) {
    const frames = [...host.querySelectorAll('.case-lead .case-frame img, .case-b .case-frame img')];
    let raf = 0;
    const tick = () => {
      raf = 0; const H = innerHeight;
      frames.forEach(im => {
        const r = im.parentNode.getBoundingClientRect(); if (r.bottom < -50 || r.top > H + 50) return;
        const k = (r.top + r.height / 2 - H / 2) / (H + r.height);           // -0.5 … 0.5
        im.style.transform = `translate3d(0, ${(k * -8).toFixed(2)}%, 0) scale(1.1)`;
      });
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    addEventListener('resize', tick); tick();
  }
})();
