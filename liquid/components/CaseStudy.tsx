import type { Img, Project } from '@/content/projects';
import { Arrow } from './Hero';
import { LiquidImage } from './LiquidImage';
import { TLink } from './Transition';

const num = (i: number) => String(i + 1).padStart(2, '0');

// Galleriet sættes op redaktionelt: liggende billeder får hele bredden (skiftevis forskudt), stående kommer i par,
// og et enligt stående billede placeres forskudt for sig selv. Rækkefølgen fra projektet bevares.
type Row = { kind: 'wide' | 'pair' | 'single'; imgs: Img[]; side: 'l' | 'r' };
function rows(gallery: Img[], cover: Img): Row[] {
  const out: Row[] = []; let pend: Img[] = []; let side: 'l' | 'r' = 'l';
  const flip = () => (side = side === 'l' ? 'r' : 'l');
  const flush = () => { if (pend.length) { out.push({ kind: pend.length === 2 ? 'pair' : 'single', imgs: pend, side: flip() }); pend = []; } };
  gallery.filter(g => g.src !== cover.src).forEach(g => {
    if (g.w > g.h * 1.1) { flush(); out.push({ kind: 'wide', imgs: [g], side: flip() }); }
    else { pend.push(g); if (pend.length === 2) flush(); }
  });
  flush();
  return out;
}

export function CaseStudy({ p, next, index, total }: { p: Project; next: Project; index: number; total: number }) {
  const gal = rows(p.gallery, p.cover);
  const all = p.gallery;
  const after = (im: Img) => all[(all.indexOf(im) + 1) % all.length];
  return (
    <article className="case" aria-labelledby="case-title">
      <header className="case-hero" id="top" data-theme="dark">
        <LiquidImage img={p.cover} alt2={p.alt} sizes="100vw" priority className="case-hero-img" reveal={false} />
        <div className="case-hero-over lq-over wrap">
          <div className="case-hero-top meta">
            <TLink href="/#work" className="link-u">← All work</TLink>
            <span>{num(index)} / {num(total - 1)}</span>
          </div>
          <div>
            <p className="meta case-cat">{p.category}</p>
            <h1 id="case-title" className="display case-title">{p.title}</h1>
            <dl className="case-meta meta">
              <div><dt>Client</dt><dd>{p.client}</dd></div>
              <div><dt>Year</dt><dd>{p.year}</dd></div>
              <div><dt>Location</dt><dd>{p.location}</dd></div>
              <div><dt>Frames</dt><dd>{p.gallery.length}</dd></div>
            </dl>
          </div>
        </div>
      </header>

      <section className="case-body" data-theme="light" aria-label="About the project">
        <div className="wrap case-intro">
          <div className="case-col">
            <p className="meta label"><b>(01)</b>Overview</p>
            <p className="case-lede" data-reveal>{p.summary}</p>
          </div>
          <div className="case-col">
            <p className="meta label"><b>(02)</b>Approach</p>
            <p className="lede" data-reveal>{p.approach}</p>
            <dl className="case-info">
              {[{ label: 'Client', value: p.client }, { label: 'Category', value: p.category }, ...p.info].map(r => (
                <div key={r.label} data-reveal><dt className="meta muted">{r.label}</dt><dd>{r.value}</dd></div>
              ))}
            </dl>
          </div>
        </div>

        <div className="case-gal wrap" aria-label="Gallery">
          <p className="meta label"><b>(03)</b>Photography</p>
          {gal.map((r, i) => (
            <div key={i} className={`grow grow-${r.kind} side-${r.side}`}>
              {r.imgs.map(im => (
                <figure key={im.src} className="gfig">
                  <LiquidImage img={im} alt2={after(im)} sizes={r.kind === 'wide' ? '(max-width: 760px) 100vw, 84vw' : '(max-width: 760px) 100vw, 42vw'} />
                  <figcaption className="meta muted">{num(all.indexOf(im))}</figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="case-next" data-theme="dark" aria-label="Next project">
        <TLink href={`/work/${next.slug}`} className="case-next-link" data-cursor="Next">
          <LiquidImage img={next.cover} alt2={next.alt} sizes="100vw" className="case-next-img" />
          <span className="case-next-over lq-over wrap">
            <span className="meta">Next project</span>
            <span className="display case-next-title">{next.title}</span>
            <span className="meta case-next-go">{next.category} · {next.year} <Arrow /></span>
          </span>
        </TLink>
      </section>
    </article>
  );
}
