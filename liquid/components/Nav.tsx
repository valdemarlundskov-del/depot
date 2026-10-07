'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { site } from '@/content/site';
import { TLink } from './Transition';

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // gennemsigtig over hero; får baggrund efter lidt scroll, og glider væk på vej ned / frem igen på vej op
  useEffect(() => {
    let last = scrollY;
    const on = () => {
      const y = scrollY;
      setSolid(y > innerHeight * .6);
      if (y <= 240 || y < last - 4) setHidden(false);
      else if (y > last + 4) setHidden(true);
      last = y;
    };
    on(); addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  // menu: lås scroll, fokus på første link, Escape lukker og giver fokus tilbage
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const first = menuRef.current?.querySelector<HTMLElement>('a, button');
    setTimeout(() => first?.focus(), 60);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); }
      if (e.key === 'Tab' && menuRef.current) {
        const f = [...menuRef.current.querySelectorAll<HTMLElement>('a, button')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; removeEventListener('keydown', key); };
  }, [open]);

  return (
    <>
      <header className={`nav${solid ? ' is-solid' : ''}${hidden && !open ? ' is-hidden' : ''}${open ? ' is-open' : ''}`}>
        <TLink href="/" className="nav-mark" aria-label="LIQUID — home" data-cursor="Home">LIQUID<sup>®</sup></TLink>
        <nav aria-label="Primary" className="nav-links">
          {site.nav.map((l, i) => (
            <TLink key={l.href} href={l.href} data-cursor="Open"><span className="nav-i">0{i + 1}</span>{l.label}</TLink>
          ))}
        </nav>
        <p className="nav-status"><span className="dot" aria-hidden="true" />{site.availability}</p>
        <button ref={btnRef} type="button" className="nav-menu" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(o => !o)}>
          <span className="nav-menu-t" data-alt="Close">{open ? 'Close' : 'Menu'}</span>
        </button>
      </header>
      <div id="menu" ref={menuRef} className={`menu${open ? ' is-open' : ''}`} aria-hidden={!open} inert={!open}>
        <nav aria-label="Menu" className="menu-links">
          {site.nav.map((l, i) => (
            <TLink key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ transitionDelay: `${open ? .18 + i * .06 : 0}s` }}>
              <span className="menu-i">0{i + 1}</span>{l.label}
            </TLink>
          ))}
        </nav>
        <div className="menu-foot">
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <span>{site.location}</span>
          <span className="nav-status menu-status"><span className="dot" aria-hidden="true" />{site.availability}</span>
        </div>
      </div>
    </>
  );
}
