import { team } from '@/content/site';

export function Studio() {
  return (
    <section className="studio" id="studio" data-theme="light" aria-labelledby="studio-title">
      <div className="wrap studio-grid">
        <div className="studio-text">
          <p className="meta label"><b>(05)</b>Studio</p>
          <h2 id="studio-title" className="h1">
            <span data-reveal="mask"><span>Small studio.</span></span>
            <span data-reveal="mask" style={{ ['--rd' as string]: '.08s' }}><span>Open possibilities.</span></span>
          </h2>
          <div className="studio-copy">
            <p className="lede" data-reveal>
              LIQUID is an independent creative studio exploring the relationship between ideas, images and movement.
              We work across disciplines to develop visual experiences with a clear point of view, from the first concept to the final frame.
            </p>
            <p data-reveal style={{ ['--rd' as string]: '.1s' }}>
              We believe the strongest work comes from curiosity, collaboration and the freedom to approach every project differently.
              Two founders, behind the camera and in the edit, with no fixed way of doing things.
            </p>
          </div>
        </div>
        <div className="studio-people">
          {team.map((m, i) => (
            <figure key={m.name} className={`person p${i}`} data-reveal style={{ ['--rd' as string]: `${i * .12}s` }}>
              <div className="person-img"><img src={m.img} alt={m.name} width={1400} height={933} loading="lazy" decoding="async" /></div>
              <figcaption>
                <span className="person-name">{m.name}</span>
                <span className="meta muted">{m.role}</span>
                <a className="meta link-u" href={m.href} target="_blank" rel="noopener noreferrer">{m.handle}<span className="sr-only"> (opens Instagram in a new tab)</span></a>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
