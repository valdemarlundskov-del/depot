'use client';
import { useEffect, useRef } from 'react';
import { manifesto } from '@/content/site';
import { SYMBOL_PATH, SYMBOL_VIEWBOX } from '@/lib/symbol';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/motion';

// hvert ord har sin egen fart; nogle løber foran, andre hænger efter — som noget, der flyder
const SPEEDS = [0, .55, -.35, .9, .25, -.5, .45];

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('[data-speed]').forEach(w => {
        gsap.fromTo(w, { yPercent: +w.dataset.speed! * 60 }, { yPercent: +w.dataset.speed! * -60, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .6 } });
      });
      gsap.fromTo('.mani-sym', { rotate: -14, scale: .8, xPercent: 8 }, {
        rotate: 10, scale: 1.18, xPercent: -6, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  let w = 0;
  return (
    <section ref={ref} className="mani" id="manifesto" data-theme="light" aria-labelledby="mani-title">
      <svg className="mani-sym" viewBox={SYMBOL_VIEWBOX} aria-hidden="true" focusable="false">
        <path d={SYMBOL_PATH} fillRule="evenodd" />
      </svg>
      <div className="wrap mani-grid">
        <p className="meta label mani-label"><b>(01)</b>Manifesto</p>
        <h2 id="mani-title" className="display mani-title">
          {manifesto.lines.map((line, li) => (
            <span key={li} className={`mani-line l${li}`}>
              {line.split(' ').map(word => {
                const i = w++;
                return (
                  <span key={word + i} className="mani-w" data-speed={SPEEDS[i % SPEEDS.length]}>
                    <span className="mani-m" data-reveal="mask" style={{ ['--rd' as string]: `${i * .07}s` }}><span>{word}</span></span>
                  </span>
                );
              })}
            </span>
          ))}
        </h2>
        <div className="mani-body">
          <p className="lede" data-reveal>{manifesto.body}</p>
          <p className="meta muted" data-reveal style={{ ['--rd' as string]: '.15s' }}>— Nothing stays still</p>
        </div>
      </div>
    </section>
  );
}
