'use client';
import { useEffect, useRef } from 'react';
import { site } from '@/content/site';
import { blobPath } from '@/lib/blobPath';
import { clamp, prefersReducedMotion } from '@/lib/motion';
import { ContactForm } from './ContactForm';

// Kontakt: en mørk, flydende form vokser frem bag overskriften, mens man scroller ind i afsnittet, og giver den en ramme.
export function Contact() {
  const sec = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    const el = sec.current; if (!el) return;
    const reduce = prefersReducedMotion();
    let raf = 0, running = false, p = 0, pS = 0;
    const draw = (now: number) => {
      const r = el.getBoundingClientRect();
      p = clamp((innerHeight - r.top) / (innerHeight * 1.1));
      pS += (p - pS) * (reduce ? 1 : .08);
      path.current?.setAttribute('d', blobPath(500, 330, 70 + pS * 300, reduce ? 0 : now / 2600, { n: 9, wobble: .18, seed: 11, stretch: 1.5 }));
      if (running && !reduce) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; cancelAnimationFrame(raf); if (running) raf = requestAnimationFrame(draw); });
    io.observe(el); raf = requestAnimationFrame(draw);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={sec} className="contact" id="contact" data-theme="dark" aria-labelledby="contact-title">
      <div className="wrap contact-grid">
        <div className="contact-head">
          <svg className="contact-blob" viewBox="0 0 1000 660" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <defs>
              <radialGradient id="cb" cx=".38" cy=".3" r=".9">
                <stop offset="0" stopColor="#24262c" /><stop offset=".55" stopColor="#141519" /><stop offset="1" stopColor="#0b0c0e" />
              </radialGradient>
            </defs>
            <path ref={path} fill="url(#cb)" />
          </svg>
          <p className="meta label"><b>(07)</b>Contact</p>
          <h2 id="contact-title" className="h1 contact-title">
            <span data-reveal="mask"><span>Have an idea?</span></span>
            <span data-reveal="mask" style={{ ['--rd' as string]: '.07s' }}><span>Let’s give it</span></span>
            <span data-reveal="mask" style={{ ['--rd' as string]: '.14s' }}><span>a form.</span></span>
          </h2>
          <p className="lede contact-lede" data-reveal>
            Have a project in mind, a question or an idea worth exploring? Tell us a little about it, and let’s see what we can create together.
          </p>
          <a className="contact-mail" href={`mailto:${site.email}`} data-cursor="Write">{site.email}</a>
        </div>
        <div className="contact-form" data-reveal>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
