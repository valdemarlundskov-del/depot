'use client';
// Ydelserne som store typografiske rækker. Aktiv række (hover, fokus eller tryk) viser sit eget medie: et foto,
// et levende klip, en komposition i bevægelse, en sekvens fra produktionen — og et flydende objekt for det digitale.
// Alt indhold er knapper med aria-expanded, så det virker med tastatur og touch; på mobil vises mediet i rækken.
import { useEffect, useRef, useState } from 'react';
import { services } from '@/content/site';
import { projects } from '@/content/projects';
import { blobPath } from '@/lib/blobPath';
import { prefersReducedMotion } from '@/lib/motion';

const P = Object.fromEntries(projects.map(p => [p.slug, p]));
const photo = P['porsche-924'].gallery.find(g => g.src.includes('DSC03359'))!;
const direction = [P['landscapes'].gallery[6], P['thailand'].gallery[5], P['porsche-924'].gallery[12]];
const production = [...P['vildbjerg-cup'].gallery.slice(0, 6), P['porsche-924'].gallery[7]];

function Film({ on }: { on: boolean }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => { const el = v.current; if (!el) return; if (on && !prefersReducedMotion()) el.play().catch(() => {}); else el.pause(); }, [on]);
  return (
    <video ref={v} muted loop playsInline preload="none" poster="/media/reel/showreel-poster.jpg">
      <source src="/media/reel/showreel-sm.webm" type="video/webm" />
      <source src="/media/reel/showreel-sm.mp4" type="video/mp4" />
    </video>
  );
}

function Sequence({ on }: { on: boolean }) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!on || prefersReducedMotion()) return;
    const t = setInterval(() => setK(x => (x + 1) % production.length), 520);
    return () => clearInterval(t);
  }, [on]);
  return (
    <div className="svc-seq">
      {production.map((im, i) => <img key={im.src} src={im.sm} alt="" loading="lazy" decoding="async" className={i === k ? 'on' : ''} />)}
      <span className="svc-seq-n meta">{String(k + 1).padStart(2, '0')} / {String(production.length).padStart(2, '0')}</span>
    </div>
  );
}

function Digital({ on }: { on: boolean }) {
  const a = useRef<SVGPathElement>(null), b = useRef<SVGPathElement>(null), c = useRef<SVGPathElement>(null);
  useEffect(() => {
    let raf = 0; const reduce = prefersReducedMotion();
    const draw = (now: number) => {
      const t = reduce ? 1 : now / 1400;
      a.current?.setAttribute('d', blobPath(200, 205, 118, t, { n: 8, wobble: .2, seed: 2 }));
      b.current?.setAttribute('d', blobPath(298 + Math.sin(t * 1.3) * 22, 108 + Math.cos(t) * 12, 34, t * 1.4, { n: 6, wobble: .22, seed: 5 }));
      c.current?.setAttribute('d', blobPath(96 + Math.cos(t * .8) * 14, 318, 22, t * 1.7, { n: 6, wobble: .25, seed: 9 }));
      if (on && !reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return (
    <svg className="svc-digital" viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <linearGradient id="chr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f5f1" /><stop offset=".22" stopColor="#9a9da5" /><stop offset=".38" stopColor="#1b1c20" />
          <stop offset=".52" stopColor="#d9d6cf" /><stop offset=".64" stopColor="#c48a5c" /><stop offset=".72" stopColor="#2a2c33" />
          <stop offset=".86" stopColor="#8fb0d8" /><stop offset="1" stopColor="#0d0e11" />
        </linearGradient>
        <radialGradient id="spec" cx=".35" cy=".3" r=".4"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="400" fill="#0b0c0f" />
      <g>
        <path ref={a} fill="url(#chr)" /><path ref={b} fill="url(#chr)" /><path ref={c} fill="url(#chr)" />
      </g>
      <ellipse cx="160" cy="150" rx="70" ry="44" fill="url(#spec)" opacity=".55" />
    </svg>
  );
}

function Media({ kind, on }: { kind: string; on: boolean }) {
  if (kind === 'photo') return <img src={photo.sm} alt="" loading="lazy" decoding="async" />;
  if (kind === 'film') return <Film on={on} />;
  if (kind === 'direction') return (
    <div className="svc-dir">{direction.map((im, i) => <img key={im.src} src={im.sm} alt="" loading="lazy" decoding="async" className={`d${i}`} />)}</div>
  );
  if (kind === 'production') return <Sequence on={on} />;
  return <Digital on={on} />;
}

export function Services() {
  const [active, setActive] = useState(0);
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const m = matchMedia('(min-width: 901px)'); const on = () => setWide(m.matches); on();
    m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  return (
    <section className="svc" id="services" data-theme="light" aria-labelledby="svc-title">
      <div className="wrap">
        <header className="svc-head">
          <p className="meta label"><b>(03)</b>What we do</p>
          <h2 id="svc-title" className="h1" data-reveal="mask"><span>Ideas take many forms.</span></h2>
        </header>
        <div className="svc-grid">
          <ul className="svc-list">
            {services.map((s, i) => (
              <li key={s.n} className={`svc-row${active === i ? ' is-on' : ''}`} data-reveal style={{ ['--rd' as string]: `${i * .06}s` }}>
                <button
                  type="button" id={`svc-b-${i}`} aria-expanded={active === i} aria-controls={`svc-p-${i}`}
                  onMouseEnter={() => wide && setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
                >
                  <span className="svc-n meta">{s.n}</span>
                  <span className="svc-t">{s.title}</span>
                  <span className="svc-plus" aria-hidden="true" />
                </button>
                <div id={`svc-p-${i}`} role="region" aria-labelledby={`svc-b-${i}`} className="svc-panel">
                  <div>
                    <p>{s.text}</p>
                    {!wide && <div className="svc-media svc-media-inline"><Media kind={s.media} on={active === i} /></div>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {wide && (
            <div className="svc-stage" aria-hidden="true">
              {services.map((s, i) => (
                <div key={s.n} className={`svc-media${active === i ? ' on' : ''}`}><Media kind={s.media} on={active === i} /></div>
              ))}
              <span className="svc-stage-cap meta">{services[active].n} — {services[active].title}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
