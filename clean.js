/* BK Studio — oprydning og effekter (se clean.css).
   - processens tre trin bindes sammen af en streg, der tegner sig ud
   - teamkortene vipper efter musen med en lysrefleks */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $$('.proc').forEach(s => s.classList.add('proc-c'));

  // "Nyopstartet": tallene tæller op fra 0, når de kommer frem (kun én gang)
  function counts() {
    const els = $$('[data-count]'); if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) return;
    els.forEach(el => { el.textContent = '0'; });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 900 + to * 12;
      const step = now => { const k = Math.min(1, (now - t0) / dur), v = 1 - Math.pow(1 - k, 3); el.textContent = String(Math.round(to * v)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    els.forEach(el => io.observe(el));
  }

  function ready() {
    counts();
    if (!('IntersectionObserver' in window)) { $$('.proc-rows').forEach(r => r.classList.add('drawn')); return; }

    // processen: stregen tegnes, når trinnene er godt inde på skærmen
    const pio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); pio.unobserve(e.target); } }), { threshold: .35 });
    $$('.proc-c .proc-rows').forEach(r => pio.observe(r));

    // kort, der vipper efter musen
    if (fine && !reduce) {
      $$('.tcard').forEach(card => {
        card.classList.add('tilt');
        let raf = 0, ev = null;
        const max = card.classList.contains('tcard') ? 5 : 8;
        function apply() {
          raf = 0; if (!ev) return;
          const r = card.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          card.style.setProperty('--ry', ((x - .5) * max).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((.5 - y) * max).toFixed(2) + 'deg');
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        }
        card.addEventListener('pointerenter', () => card.classList.add('tilting'));
        card.addEventListener('pointermove', e => { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
        card.addEventListener('pointerleave', () => { ev = null; card.classList.remove('tilting'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
