'use client';
import { useEffect, useRef, useState } from 'react';
import { projects, type Project } from '@/content/projects';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/motion';
import { Arrow } from './Hero';
import { LiquidImage } from './LiquidImage';
import { TLink } from './Transition';

const num = (i: number) => String(i + 1).padStart(2, '0');

function Meta({ p }: { p: Project }) {
  return (
    <dl className="pmeta meta">
      <div><dt>Client</dt><dd>{p.client}</dd></div>
      <div><dt>Category</dt><dd>{p.category}</dd></div>
      <div><dt>Year</dt><dd>{p.year}</dd></div>
    </dl>
  );
}

function ViewLink({ p }: { p: Project }) {
  return (
    <TLink href={`/work/${p.slug}`} className="pview meta" aria-label={`View project: ${p.title}`}>
      <span>View project</span><Arrow />
    </TLink>
  );
}

function Cinematic({ p, i }: { p: Project; i: number }) {
  return (
    <article className="proj proj-cine wrap" aria-labelledby={`p-${p.slug}`}>
      <TLink href={`/work/${p.slug}`} className="proj-media" data-cursor="View" tabIndex={-1} aria-hidden="true">
        <LiquidImage img={p.cover} alt2={p.alt} sizes="(max-width: 760px) 100vw, 92vw" className="ar-cine" />
      </TLink>
      <div className="proj-cine-row">
        <span className="pnum" aria-hidden="true">{num(i)}</span>
        <h3 id={`p-${p.slug}`} className="ptitle" data-reveal="mask"><span>{p.title}</span></h3>
        <div className="proj-cine-side" data-reveal>
          <p className="pdesc">{p.summary}</p>
          <Meta p={p} />
          <ViewLink p={p} />
        </div>
      </div>
    </article>
  );
}

function Asymmetric({ p, i }: { p: Project; i: number }) {
  return (
    <article className="proj proj-asym wrap" aria-labelledby={`p-${p.slug}`}>
      <div className="proj-asym-text">
        <span className="pnum pnum-xl" aria-hidden="true">{num(i)}</span>
        <h3 id={`p-${p.slug}`} className="ptitle" data-reveal="mask"><span>{p.title}</span></h3>
        <p className="pdesc" data-reveal>{p.summary}</p>
        <Meta p={p} />
        <ViewLink p={p} />
      </div>
      <TLink href={`/work/${p.slug}`} className="proj-media proj-asym-img" data-cursor="View" tabIndex={-1} aria-hidden="true">
        <LiquidImage img={p.cover} alt2={p.alt} sizes="(max-width: 760px) 100vw, 50vw" className="ar-port" />
      </TLink>
      <TLink href={`/work/${p.slug}`} className="proj-media proj-asym-small" data-cursor="View" tabIndex={-1} aria-hidden="true">
        <LiquidImage img={p.gallery[3]} alt2={p.gallery[10]} sizes="(max-width: 760px) 60vw, 22vw" className="ar-port" />
      </TLink>
    </article>
  );
}

function Sequence({ p, i }: { p: Project; i: number }) {
  const track = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = host.current, tr = track.current; if (!el || !tr || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(tr, { x: () => innerWidth * .08 }, {
        x: () => -(tr.scrollWidth - innerWidth) - innerWidth * .04, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .8, invalidateOnRefresh: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);
  const frames = [p.cover, ...p.gallery.filter(g => g.src !== p.cover.src)].slice(0, 6);
  return (
    <article ref={host} className="proj proj-seq" aria-labelledby={`p-${p.slug}`}>
      <div className="wrap proj-seq-head">
        <span className="pnum" aria-hidden="true">{num(i)}</span>
        <h3 id={`p-${p.slug}`} className="ptitle" data-reveal="mask"><span>{p.title}</span></h3>
        <div className="proj-seq-side" data-reveal>
          <p className="pdesc">{p.summary}</p>
          <Meta p={p} />
          <ViewLink p={p} />
        </div>
      </div>
      <div ref={track} className="proj-seq-track">
        {frames.map((f, k) => (
          <TLink key={f.src} href={`/work/${p.slug}`} className={`proj-media seq-f ${f.w > f.h ? 'is-land' : 'is-port'}`} data-cursor="View" tabIndex={-1} aria-hidden="true">
            <LiquidImage img={f} alt2={frames[(k + 3) % frames.length]} sizes="(max-width: 760px) 80vw, 40vw" />
            <span className="seq-n meta">{num(k)} / {num(frames.length - 1)}</span>
          </TLink>
        ))}
      </div>
    </article>
  );
}

function Fullscreen({ p, i }: { p: Project; i: number }) {
  return (
    <article className="proj proj-full" aria-labelledby={`p-${p.slug}`}>
      <TLink href={`/work/${p.slug}`} className="proj-media proj-full-media" data-cursor="View" tabIndex={-1} aria-hidden="true">
        <LiquidImage img={p.cover} alt2={p.alt} sizes="100vw" />
      </TLink>
      <div className="proj-full-over lq-over">
        <span className="meta">{num(i)} — {p.category}</span>
        <h3 id={`p-${p.slug}`} className="ptitle ptitle-xl" data-reveal="mask"><span>{p.title}</span></h3>
        <div className="proj-full-foot">
          <span className="meta">{p.client} · {p.year}</span>
          <ViewLink p={p} />
        </div>
      </div>
    </article>
  );
}

function Reel() {
  const v = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const userPaused = useRef(false);
  useEffect(() => {
    const el = v.current; if (!el) return;
    if (prefersReducedMotion()) { userPaused.current = true; setPaused(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused.current) el.play().catch(() => setPaused(true));
      else el.pause();
    }, { threshold: .2 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const toggle = () => {
    const el = v.current; if (!el) return;
    if (el.paused) { userPaused.current = false; el.play().catch(() => {}); setPaused(false); }
    else { userPaused.current = true; el.pause(); setPaused(true); }
  };
  return (
    <figure className="reel" aria-label="Showreel">
      <div className="reel-frame" data-reveal>
        <video ref={v} muted loop playsInline preload="none" poster="/media/reel/showreel-poster.jpg" aria-label="BK Studio showreel, without sound">
          <source src="/media/reel/showreel-sm.webm" type="video/webm" />
          <source src="/media/reel/showreel-sm.mp4" type="video/mp4" />
        </video>
      </div>
      <figcaption className="reel-cap wrap">
        <span className="h2">Showreel</span>
        <span className="meta muted">Photo · Film · Motion — 2026</span>
        <button type="button" className="btn btn-line reel-btn" onClick={toggle} aria-pressed={paused}>
          {paused ? 'Play reel' : 'Pause reel'}
        </button>
      </figcaption>
    </figure>
  );
}

const LAYOUTS = { cinematic: Cinematic, asymmetric: Asymmetric, sequence: Sequence, fullscreen: Fullscreen };

export function Work() {
  return (
    <section className="work" id="work" data-theme="dark" aria-labelledby="work-title">
      <header className="wrap work-head">
        <p className="meta label"><b>(02)</b>Selected work</p>
        <h2 id="work-title" className="h1 work-title">
          <span data-reveal="mask"><span>Selected work.</span></span>
          <span data-reveal="mask" style={{ ['--rd' as string]: '.08s' }}><span className="work-t2">Unfixed perspectives.</span></span>
        </h2>
        <ol className="work-index meta" aria-label="Project index">
          {projects.map((p, i) => (
            <li key={p.slug}><TLink href={`/work/${p.slug}`} data-cursor="View"><span>{num(i)}</span>{p.title}<em>{p.year}</em></TLink></li>
          ))}
        </ol>
      </header>
      {projects.map((p, i) => { const L = LAYOUTS[p.layout]; return <L key={p.slug} p={p} i={i} />; })}
      <Reel />
    </section>
  );
}
