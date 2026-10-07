import { site } from '@/content/site';
import { TLink } from './Transition';

export function Footer() {
  return (
    <footer className="foot" data-theme="dark">
      <div className="wrap">
        <p className="foot-close h1">
          <span>Nothing stays still.</span>
          <span className="muted">Neither should we.</span>
        </p>
        <div className="foot-grid">
          <nav aria-label="Footer" className="foot-col">
            <span className="meta muted">Index</span>
            {site.nav.map(l => <TLink key={l.href} href={l.href} className="link-u">{l.label}</TLink>)}
          </nav>
          <div className="foot-col">
            <span className="meta muted">Social</span>
            {site.socials.map(s => (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="link-u">
                {s.label} — {s.handle}<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </div>
          <div className="foot-col">
            <span className="meta muted">Studio</span>
            <a href={`mailto:${site.email}`} className="link-u">{site.email}</a>
            <span>{site.location}</span>
          </div>
          <div className="foot-col">
            <span className="meta muted">Status</span>
            <span className="nav-status foot-status"><span className="dot" aria-hidden="true" />{site.availability}</span>
          </div>
        </div>
        <p className="foot-word" aria-hidden="true">LIQUID<sup>®</sup></p>
        <div className="foot-bottom meta muted">
          <span>© 2026 LIQUID — a concept by {site.operatedBy}</span>
          <a href="#top" className="link-u">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
