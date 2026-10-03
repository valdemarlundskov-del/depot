// BK Studio — arkiv: tæt billedgitter med filter og fuldskærmsvisning. Bruger ARCHIVE fra archive.js.
(function () {
  const grid = document.getElementById('akGrid');
  if (!grid || typeof ARCHIVE === 'undefined') return;
  const filt = document.getElementById('akFilter');
  const count = document.getElementById('akCount');
  const lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'), lbCount = document.getElementById('lbCount');
  const lbLabel = document.getElementById('lbLabel'), lbLink = document.getElementById('lbLink');
  const linkFor = p => (typeof projects !== 'undefined' && projects.some(x => x.id === p)) ? `/arbejde#${p}` : '/arbejde';
  let current = 'alle', list = [], idx = 0, opener = null;

  grid.innerHTML = ARCHIVE.map((a, i) => `<button class="ak-item" data-p="${a.p}" data-i="${i}" style="aspect-ratio:${a.w}/${a.h}" aria-label="Åbn billede: ${ARCHIVE_LABELS[a.p] || a.p}"><img src="${a.m}" srcset="${a.m} 480w, ${a.t} 1100w" sizes="(max-width:700px) 50vw, (max-width:1100px) 33vw, 20vw" width="${a.w}" height="${a.h}" alt="${ARCHIVE_LABELS[a.p] || a.p}" loading="lazy" decoding="async"><span class="ak-tag">${ARCHIVE_LABELS[a.p] || a.p}</span></button>`).join('');
  const items = [...grid.children];

  const counts = {}; ARCHIVE.forEach(a => { counts[a.p] = (counts[a.p] || 0) + 1; });
  const chips = [['alle', 'Alle', ARCHIVE.length], ...Object.keys(ARCHIVE_LABELS).filter(p => counts[p]).map(p => [p, ARCHIVE_LABELS[p], counts[p]])];
  filt.innerHTML = chips.map(([p, l, n]) => `<button class="chip" data-f="${p}" aria-pressed="${p === 'alle'}">${l}<sup>${n}</sup></button>`).join('');
  if (count) count.textContent = ARCHIVE.length;

  function apply(f, push) {
    current = f;
    filt.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.f === f));
    let n = 0;
    items.forEach(el => {
      const show = f === 'alle' || el.dataset.p === f;
      el.hidden = !show;
      el.classList.remove('in');
      if (show) { el.style.setProperty('--i', (n++ % 12) * 0.035 + 's'); }
    });
    list = items.filter(el => !el.hidden).map(el => +el.dataset.i);
    requestAnimationFrame(() => items.forEach(el => { if (!el.hidden) el.classList.add('in'); }));
    if (push) history.replaceState(null, '', f === 'alle' ? '/arkiv' : `/arkiv#${f}`);
  }
  filt.addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) { apply(c.dataset.f, true); document.dispatchEvent(new CustomEvent('arkfilter', { detail: c.dataset.f })); } });
  document.addEventListener('arkfilter', e => { if (e.detail !== current) apply(e.detail, true); });
  const h0 = location.hash.replace('#', '');
  apply(ARCHIVE_LABELS[h0] ? h0 : 'alle', false);
  if (ARCHIVE_LABELS[h0]) document.dispatchEvent(new CustomEvent('arkfilter', { detail: h0 }));

  // fuldskærmsvisning
  function show(i) {
    const pos = list.indexOf(i); if (pos < 0) return;
    idx = pos;
    const a = ARCHIVE[i];
    lbImg.classList.remove('sharp', 'image-error');                            // en tidligere fejlmarkering må ikke skjule billedet
    lbImg.src = a.t; lbImg.alt = ARCHIVE_LABELS[a.p] || '';
    const full = new Image(); full.onload = () => { if (list[idx] === i) { lbImg.classList.remove('image-error'); lbImg.src = a.s; lbImg.classList.add('sharp'); } }; full.src = a.s;
    lbCount.textContent = `${String(pos + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    lbLabel.textContent = ARCHIVE_LABELS[a.p] || '';
    lbLink.href = linkFor(a.p);
    [1, -1].forEach(d => { const j = list[(pos + d + list.length) % list.length]; const pre = new Image(); pre.src = ARCHIVE[j].t; });
  }
  lbImg.addEventListener('load', () => lbImg.classList.remove('image-error'));
  function open(i) {
    opener = document.activeElement;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lb.classList.add('open'));
    show(i); document.getElementById('lbClose').focus();
  }
  function close() {
    lb.classList.remove('open'); document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lbImg.src = ''; }, 350);
    if (opener && opener.focus) opener.focus();
  }
  const step = d => show(list[(idx + d + list.length) % list.length]);
  grid.addEventListener('click', e => { const b = e.target.closest('.ak-item'); if (b) open(+b.dataset.i); });
  window.ARK_OPEN = i => { if (list.indexOf(i) < 0) { apply('alle', true); document.dispatchEvent(new CustomEvent('arkfilter', { detail: 'alle' })); } open(i); };
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', () => step(-1));
  document.getElementById('lbNext').addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-fig')) close(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1);
  });
  let sx = 0;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); }, { passive: true });

  // reveal ved scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('seen'));
})();
