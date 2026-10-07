'use client';
// Processen som ét forløb: en flydende masse bevæger sig langs linjen, mens man scroller, strækkes i farten,
// samler sig ved hvert trin og bliver større og roligere undervejs — fra en lille dråbe til en færdig form.
import { useEffect, useRef, useState } from 'react';
import { process } from '@/content/site';
import { blobPath } from '@/lib/blobPath';
import { clamp, prefersReducedMotion } from '@/lib/motion';

export function Process() {
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const mass = useRef<SVGPathElement>(null);
  const trail = useRef<SVGLineElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = sec.current, tr = track.current; if (!el || !tr) return;
    const reduce = prefersReducedMotion();
    let raf = 0, p = 0, pS = 0, last = performance.now(), running = false, W = 0, H = 0, vertical = false;
    const size = () => {
      const r = tr.getBoundingClientRect(); W = r.width; H = r.height; vertical = matchMedia('(max-width: 900px)').matches;
      svg.current?.setAttribute('viewBox', `0 0 ${W} ${H}`);
      if (trail.current) { trail.current.setAttribute('x1', vertical ? '28' : '0'); trail.current.setAttribute('y1', vertical ? '0' : String(H / 2)); }
    };
    const measure = () => {
      const r = el.getBoundingClientRect();
      p = vertical ? clamp((innerHeight * .55 - r.top) / r.height) : clamp(-r.top / Math.max(1, r.height - innerHeight));
    };
    const draw = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const prev = pS; pS += (p - pS) * (reduce ? 1 : 1 - Math.exp(-dt * 6));
      const v = (pS - prev) / Math.max(dt, 1e-3);
      // 4 stop: massen hviler lidt ved hvert trin
      const seg = pS * 3, k = Math.floor(Math.min(seg, 2.999)), f = seg - k, ease = f < .5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
      const pos = (k + ease) / 3;
      const r = (vertical ? 18 : 24) + pos * (vertical ? 14 : 34);
      const stretch = 1 + Math.min(1.4, Math.abs(v) * (vertical ? 2.2 : 3.2));
      const x = vertical ? 28 : 40 + pos * (W - 80), y = vertical ? 30 + pos * (H - 60) : H / 2;
      mass.current?.setAttribute('d', blobPath(x, y, r, now / 900, { n: 8, wobble: .26 - pos * .14, seed: 6, stretch, angle: vertical ? Math.PI / 2 : 0 }));
      if (trail.current) { trail.current.setAttribute('x2', String(vertical ? 28 : x)); trail.current.setAttribute('y2', String(vertical ? y : H / 2)); }
      const a = Math.min(3, Math.round(pos * 3));
      setActive(s => (s === a ? s : a));
      if (running) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } else cancelAnimationFrame(raf);
    });
    size(); measure(); io.observe(el);
    const ro = new ResizeObserver(size); ro.observe(tr);
    addEventListener('scroll', measure, { passive: true });
    return () => { io.disconnect(); ro.disconnect(); removeEventListener('scroll', measure); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={sec} className="proc" id="process" data-theme="light" aria-labelledby="proc-title">
      <div className="proc-sticky">
        <div className="wrap proc-inner">
          <header className="proc-head">
            <p className="meta label"><b>(06)</b>Process</p>
            <h2 id="proc-title" className="h1">
              <span data-reveal="mask"><span>From first thought</span></span>
              <span data-reveal="mask" style={{ ['--rd' as string]: '.08s' }}><span>to final form.</span></span>
            </h2>
          </header>
          <div ref={track} className="proc-track">
            <svg ref={svg} className="proc-svg" aria-hidden="true" focusable="false">
              <line ref={trail} className="proc-trail" />
              <path ref={mass} className="proc-mass" />
            </svg>
            <ol className="proc-steps">
              {process.map((s, i) => (
                <li key={s.n} className={i <= active ? 'is-on' : ''} aria-current={i === active ? 'step' : undefined}>
                  <span className="meta proc-n">{s.n}</span>
                  <h3 className="proc-t">{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
