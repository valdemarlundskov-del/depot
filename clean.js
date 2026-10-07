/* BK Studio — oprydning og effekter (se clean.css).
   - processens tre trin bindes sammen af en streg, der tegner sig ud
   - teamkortene vipper efter musen med en lysrefleks */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $$('.proc').forEach(s => s.classList.add('proc-c'));

  // showreel: hentes først, når den nærmer sig skærmen, spiller kun mens den er synlig og vokser ud til fuld bredde
  function reel() {
    const sec = document.querySelector('.reel'), v = sec && sec.querySelector('.reel-video'); if (!v) return;
    const sd = navigator.connection && navigator.connection.saveData;
    let loaded = false, vis = false;
    function load() {
      if (v.dataset.poster) { v.poster = v.dataset.poster; delete v.dataset.poster; }       // forsidebilledet hentes også først, når showreelen nærmer sig
      if (loaded || sd || reduce) return; loaded = true;
      const mp4 = v.canPlayType && /(probably|maybe)/.test(v.canPlayType('video/mp4; codecs="avc1.64001f"'));
      v.src = 'video/showreel' + (innerWidth < 700 ? '-sm' : '') + (mp4 ? '.mp4' : '.webm'); v.load();
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { if (es[0].isIntersecting) load(); }, { rootMargin: '900px 0px' }).observe(sec);
      new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis && loaded) v.play().catch(() => {}); else v.pause(); }, { threshold: .2 }).observe(v);
    } else load();
    v.addEventListener('canplay', () => { if (vis) v.play().catch(() => {}); });
    if (reduce) return;
    let q = false;
    const upd = () => { q = false; const r = sec.getBoundingClientRect(); const k = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .9))); sec.style.setProperty('--rs', (k * k * (3 - 2 * k)).toFixed(3)); };
    addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }

  function ready() {
    reel();
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
