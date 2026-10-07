/* BK Studio — oprydning og effekter (se clean.css).
   - ydelserne står i et gitter: den låste side-scroll i v2.js slås fra, før den starter
   - processens tre trin bindes sammen af en streg, der tegner sig ud
   - billeder dukker op gennem BK-blobben, når de kommer ind på skærmen
   - ydelses- og teamkort vipper efter musen med en lysrefleks */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ydelser: v2.js læser [data-svc] først ved DOMContentLoaded, så attributten fjernes her (scriptet ligger før v2.js)
  $$('.pns[data-svc]').forEach(s => { s.removeAttribute('data-svc'); s.classList.add('pns-c'); });
  $$('.proc').forEach(s => s.classList.add('proc-c'));

  function ready() {
    if (!('IntersectionObserver' in window)) { $$('.proc-rows').forEach(r => r.classList.add('drawn')); return; }

    // processen: stregen tegnes, når trinnene er godt inde på skærmen
    const pio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); pio.unobserve(e.target); } }), { threshold: .35 });
    $$('.proc-c .proc-rows').forEach(r => pio.observe(r));

    // billeder gennem blobben (kun hvor browseren kan animere masken)
    if (!reduce && window.CSS && CSS.registerProperty) {
      const imgs = $$('.pns-c .sv-img:not(.sv-mark), .tm-img');
      const bio = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        const n = e.target; bio.unobserve(n);
        setTimeout(() => n.classList.add('blob-in'), (+n.dataset.blobDelay || 0));
        setTimeout(() => n.classList.add('blob-done'), 1700 + (+n.dataset.blobDelay || 0));
      }), { threshold: .25 });
      imgs.forEach((n, i) => {
        if (n.getBoundingClientRect().top < innerHeight * .9 && n.getBoundingClientRect().bottom > 0) return;   // allerede synlig ved indlæsning: ingen effekt
        n.dataset.blobDelay = (i % 4) * 110;
        n.classList.add('blob-rv'); bio.observe(n);
      });
    }

    // kort, der vipper efter musen
    if (fine && !reduce) {
      $$('.pns-c .sv, .tcard').forEach(card => {
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
