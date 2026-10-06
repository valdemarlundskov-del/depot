/* BK Studio — et mere moderne udtryk (hører til refine.css).
   - de håndtegnede bogstaver i menuen og på "Start et projekt" skiftes ud med almindelig tekst (billedets alt-tekst, som i18n.js allerede har oversat)
   - hårstregen efter "(01) Ydelser" osv. trækkes ud til kanten, når etiketten kommer ind på skærmen
   - "BK Studio" nederst i footeren tilpasses, så det fylder hele bredden */
(function () {
  'use strict';
  document.querySelectorAll('img.nav-lt, img.drop-lt, .cta-float > img, .book-btn img').forEach(function (img) {
    const t = document.createElement('span'); t.className = 'lt-text'; t.textContent = img.getAttribute('alt') || '';
    img.replaceWith(t);
  });

  const labs = document.querySelectorAll('.m-idx');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    labs.forEach(l => io.observe(l));
  } else labs.forEach(l => l.classList.add('in'));

  function fit() {
    document.querySelectorAll('.foot-mega .fm-type').forEach(function (t) {
      const box = t.parentElement.clientWidth; if (!box) return;
      t.style.fontSize = '100px';
      t.style.fontSize = (100 * box / t.scrollWidth * .995).toFixed(2) + 'px';
    });
  }
  fit(); addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
