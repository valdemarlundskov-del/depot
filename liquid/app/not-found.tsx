import { TLink } from '@/components/Transition';

export default function NotFound() {
  return (
    <section className="nf" data-theme="dark">
      <div className="wrap">
        <p className="meta muted">404 — Out of shape</p>
        <h1 className="display">Nothing<br />here.</h1>
        <p className="lede">This page has moved on, the way things do.</p>
        <TLink href="/" className="btn btn-line">Back to the studio</TLink>
      </div>
    </section>
  );
}
