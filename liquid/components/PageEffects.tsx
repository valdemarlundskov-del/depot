'use client';
// Fælles sideeffekter: lyset skifter mellem mørke og lyse afsnit (hele siden glider over i ny farve, i stedet for hårde
// kanter mellem sektioner), og elementer med data-reveal toner frem, første gang de kommer ind på skærmen.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PageEffects() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const sections = [...document.querySelectorAll<HTMLElement>('[data-theme]')];
    if (sections[0]) root.dataset.theme = sections[0].dataset.theme;
    const tio = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) root.dataset.theme = (e.target as HTMLElement).dataset.theme; });
    }, { rootMargin: '-48% 0px -52% 0px' });
    sections.forEach(s => tio.observe(s));

    const rio = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => rio.observe(el));
    return () => { tio.disconnect(); rio.disconnect(); };
  }, [pathname]);
  return null;
}
