/* BK Studio — Arbejde: projekterne som en nummereret liste (nummer, titel, type, år).
   Med mus dukker projektets billede op ved markøren, og de andre rækker træder tilbage. På mobil står et lille billede i hver række.
   Listen bygges ud fra projektkortene, som script.js laver, så den altid følger de samme data. Klik åbner projektet som før. */
(function () {
  'use strict';
  const grid = document.getElementById('workGrid'); if (!grid) return;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function build() {
    const items = [...grid.querySelectorAll('.work-item')]; if (!items.length || document.querySelector('.pidx')) return !!items.length;
    const list = document.createElement('ol'); list.className = 'pidx';
    items.forEach((it, i) => {
      const t = (it.querySelector('h3') || {}).textContent || '', cat = (it.querySelector('.cat') || {}).textContent || '', yr = (it.querySelector('.yr') || {}).textContent || '';
      const im = it.querySelector('.frame > img'), src = im ? (im.getAttribute('src') || '') : '';
      const li = document.createElement('li'); const a = document.createElement('a'); a.className = 'pidx-row'; a.href = it.getAttribute('href') || '#';
      a.innerHTML = '<span class="pidx-n">' + String(i + 1).padStart(2, '0') + '</span><span class="pidx-t"></span><span class="pidx-c"></span><span class="pidx-y"></span><span class="pidx-a" aria-hidden="true">→</span><img class="pidx-thumb" alt="" loading="lazy" decoding="async">';
      a.querySelector('.pidx-t').textContent = t.trim(); a.querySelector('.pidx-c').textContent = cat.trim(); a.querySelector('.pidx-y').textContent = yr.trim();
      a.querySelector('.pidx-thumb').src = src; a.dataset.src = src;
      li.appendChild(a); list.appendChild(li);
    });
    grid.after(list); grid.classList.add('pidx-hidden');
    if (fine) floatPreview(list);
    return true;
  }
  function floatPreview(list) {
    const fl = document.createElement('div'); fl.className = 'pidx-float'; fl.setAttribute('aria-hidden', 'true');
    const im = document.createElement('img'); im.alt = ''; fl.appendChild(im); document.body.appendChild(fl);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
    const tick = () => { x += (tx - x) * (reduce ? 1 : .14); y += (ty - y) * (reduce ? 1 : .14); fl.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px'; raf = (Math.abs(tx - x) + Math.abs(ty - y) > .4) ? requestAnimationFrame(tick) : 0; };
    list.addEventListener('mousemove', e => { tx = e.clientX - fl.offsetWidth * .5; ty = e.clientY - fl.offsetHeight * .5; if (!on) { x = tx; y = ty; } if (!raf) raf = requestAnimationFrame(tick); });
    list.querySelectorAll('.pidx-row').forEach(r => r.addEventListener('mouseenter', () => { if (im.getAttribute('src') !== r.dataset.src) im.src = r.dataset.src; fl.classList.add('on'); on = true; }));
    list.addEventListener('mouseleave', () => { fl.classList.remove('on'); on = false; });
    addEventListener('scroll', () => { if (on) { fl.classList.remove('on'); on = false; } }, { passive: true });
  }
  if (!build()) { const mo = new MutationObserver(() => { if (build()) mo.disconnect(); }); mo.observe(grid, { childList: true }); }
})();
