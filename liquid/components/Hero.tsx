'use client';
import { useEffect, useRef } from 'react';
import { site } from '@/content/site';
import { SYMBOL_PATH, SYMBOL_VIEWBOX } from '@/lib/symbol';
import { TLink } from './Transition';
import { useBlobScene } from './useBlobScene';

const WORD = 'LIQUID'.split('');

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const intro = useRef(false);
  if (typeof document !== 'undefined' && !intro.current) intro.current = document.documentElement.classList.contains('intro');
  const { scene, fallback, ready } = useBlobScene(canvas, section, { eager: true, intro: intro.current, material: 'wet', offset: true });

  // markøren og scroll: objektet læner sig mod markøren; på vej ned bliver det til chrome, og ordet strækkes
  useEffect(() => {
    const el = section.current; if (!el) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0) return;
      const inside = e.clientY >= r.top && e.clientY <= r.bottom;
      scene.current?.setPointer((e.clientX / innerWidth) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1), inside);
    };
    const scroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, Math.max(0, scrollY / (el.offsetHeight || 1)));
        el.style.setProperty('--p', p.toFixed(4));
        scene.current?.setScrollMix(p * 1.6);
      });
    };
    scroll();
    addEventListener('pointermove', move, { passive: true });
    addEventListener('scroll', scroll, { passive: true });
    return () => { removeEventListener('pointermove', move); removeEventListener('scroll', scroll); cancelAnimationFrame(raf); };
  }, [scene, ready]);

  return (
    <section ref={section} className="hero" id="top" data-theme="dark" aria-labelledby="hero-title">
      <canvas ref={canvas} className={`hero-canvas${ready ? ' is-ready' : ''}`} aria-hidden="true" data-cursor="Explore" />
      {fallback && (
        <div className="hero-fallback" aria-hidden="true">
          <svg viewBox={SYMBOL_VIEWBOX}><path d={SYMBOL_PATH} fillRule="evenodd" /></svg>
        </div>
      )}

      <div className="hero-grid wrap">
        <div className="hero-copy">
          <p className="meta hero-kicker"><span className="ii" style={{ ['--d' as string]: '.55s' }}>({site.descriptor})</span></p>
          <h1 id="hero-title" className="hero-title">
            <span className="ln"><span className="ii" style={{ ['--d' as string]: '.62s' }}>Nothing</span></span>
            <span className="ln"><span className="ii" style={{ ['--d' as string]: '.72s' }}>stays still.</span></span>
          </h1>
          <p className="hero-sub"><span className="ii fade" style={{ ['--d' as string]: '.95s' }}>{site.heroLine}</span></p>
          <div className="hero-ctas ii fade" style={{ ['--d' as string]: '1.05s' }}>
            <TLink href="/#work" className="btn btn-solid" data-magnetic data-cursor="Scroll">
              <span>Explore our work</span><Arrow />
            </TLink>
            <TLink href="/#contact" className="btn btn-line" data-magnetic>
              <span>Start a project</span>
            </TLink>
          </div>
        </div>
        <ul className="hero-meta meta ii fade" style={{ ['--d' as string]: '1.1s' }} aria-label="Studio">
          <li><span>01</span>Photography</li>
          <li><span>02</span>Film &amp; Motion</li>
          <li><span>03</span>Creative Direction</li>
          <li><span>04</span>Digital &amp; 3D</li>
          <li className="hero-loc">{site.location}<br />{site.coords}</li>
        </ul>
      </div>

      <p className="hero-word" aria-label="LIQUID">
        {WORD.map((c, i) => (
          <span key={i} aria-hidden="true" className="hw-l" style={{ ['--i' as string]: i }}>{c}</span>
        ))}
        <sup aria-hidden="true">®</sup>
      </p>

      <div className="hero-foot wrap meta">
        <span>Index — 2026</span>
        <span className="hero-scroll" aria-hidden="true"><i />Scroll</span>
        <span>Ideas in motion</span>
      </div>
    </section>
  );
}

export function Arrow() {
  return (
    <svg className="arr" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
