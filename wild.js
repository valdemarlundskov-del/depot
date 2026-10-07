/* sætter --hh = højden på den faste header, så sider med fuld-skærms-åbning kan starte under den */
(function () {
  const hdr = document.querySelector('header.site-header');
  const set = () => document.documentElement.style.setProperty('--hh', (hdr ? hdr.offsetHeight : 78) + 'px');
  set(); addEventListener('resize', set); addEventListener('load', set);

  /* Om os: én person ad gangen. Man lander på den, man trykkede på fra forsiden; "Mød resten af holdet" skifter til den anden. */
  const getCards = () => [...document.querySelectorAll('.mh-p[data-who]')];
  if (getCards().length) {
    const root = document.documentElement, names = { valdemar: 'Valdemar Kure Lundskov', basharat: 'Basharat Ullah Dar' };
    const who = () => (root.getAttribute('data-who') === 'basharat' ? 'basharat' : 'valdemar');
    const mark = () => getCards().forEach(c => c.setAttribute('aria-current', c.dataset.who === who() ? 'true' : 'false'));
    function show(id, push) {
      if (!names[id]) id = 'valdemar';
      const changed = id !== who();
      root.setAttribute('data-who', id);
      root.classList.remove('swapped'); void root.offsetWidth; root.classList.add('swapped');            // starter ind-animationen forfra
      document.title = names[id] + ' — Om os | BK Studio';
      mark();
      if (push && changed) history.pushState(null, '', '#' + id);
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    document.addEventListener('click', e => { const c = e.target.closest && e.target.closest('.mh-p[data-who]'); if (!c) return; e.preventDefault(); show(c.dataset.who, true); });
    addEventListener('popstate', () => { const h = (location.hash || '').slice(1); root.setAttribute('data-who', h === 'basharat' ? 'basharat' : 'valdemar'); document.title = names[who()] + ' — Om os | BK Studio'; mark(); scrollTo(0, 0); });
    mark(); document.title = names[who()] + ' — Om os | BK Studio';

    if (location.hash) scrollTo(0, 0);                                                                  // ingen hop til midten af siden ved ankomst
  }
})();
