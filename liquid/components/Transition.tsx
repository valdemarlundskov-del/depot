'use client';
// Sideovergange: en mørk, flydende masse vokser ud fra der, hvor man klikkede, dækker skærmen, siden skiftes bag den,
// og massen trækker sig sammen igen. Samme organiske form som resten af sitet. Uden animation ved reduced motion.
import { createContext, useCallback, useContext, useEffect, useRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { blobPath } from '@/lib/blobPath';
import { prefersReducedMotion } from '@/lib/motion';

type Go = (href: string, at?: { x: number; y: number }) => void;
const Ctx = createContext<Go>(() => {});
export const useGo = () => useContext(Ctx);

const ease = (t: number) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function scrollToHash(hash: string, smooth: boolean) {
  const el = hash ? document.getElementById(hash.replace('#', '')) : null;
  if (el) el.scrollIntoView({ behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'auto' });
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const wrap = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const covered = useRef(false);
  const pendingHash = useRef('');
  const origin = useRef({ x: 0, y: 0 });
  const anim = useRef(0);

  const run = useCallback((from: number, to: number, dur: number, done?: () => void) => {
    cancelAnimationFrame(anim.current);
    const w = innerWidth, h = innerHeight, o = origin.current;
    const R = Math.hypot(Math.max(o.x, w - o.x), Math.max(o.y, h - o.y)) * 1.45;
    const svg = wrap.current!.querySelector('svg')!;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const t0 = performance.now();
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), v = from + (to - from) * ease(k);
      path.current!.setAttribute('d', blobPath(o.x, o.y, Math.max(.01, v * R), now / 600, { n: 9, wobble: .2 * (1 - v * .5), seed: 3 }));
      if (k < 1) anim.current = requestAnimationFrame(frame); else done?.();
    };
    anim.current = requestAnimationFrame(frame);
  }, []);

  const current = useRef(pathname);
  current.current = pathname;
  const go = useCallback<Go>((href, at) => {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) { location.href = href; return; }
    if (url.pathname === current.current) { scrollToHash(url.hash, true); return; }
    pendingHash.current = url.hash;
    if (prefersReducedMotion() || !wrap.current) { router.push(url.pathname + url.hash); return; }
    origin.current = at ?? { x: innerWidth / 2, y: innerHeight / 2 };
    wrap.current.dataset.state = 'in';
    run(0, 1, 720, () => { covered.current = true; router.push(url.pathname + url.hash, { scroll: false }); });
  }, [router, run]);

  // ny side er på plads: scroll til målet og lad massen trække sig sammen
  useEffect(() => {
    const hash = pendingHash.current; pendingHash.current = '';
    if (!covered.current) { if (hash) requestAnimationFrame(() => scrollToHash(hash, false)); return; }
    covered.current = false;
    scrollToHash(hash, false);
    origin.current = { x: innerWidth * .5, y: innerHeight * 1.05 };
    requestAnimationFrame(() => run(1, 0, 760, () => { if (wrap.current) wrap.current.dataset.state = 'idle'; }));
  }, [pathname, run]);

  return (
    <Ctx.Provider value={go}>
      {children}
      <div ref={wrap} className="wipe" data-state="idle" aria-hidden="true">
        <svg preserveAspectRatio="none"><path ref={path} d="" /></svg>
        <span className="wipe-mark">LIQUID<sup>®</sup></span>
      </div>
    </Ctx.Provider>
  );
}

type TLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
export function TLink({ href, onClick, children, ...rest }: TLinkProps) {
  const go = useGo();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || rest.target === '_blank') return;
    e.preventDefault();
    go(href, { x: e.clientX || innerWidth / 2, y: e.clientY || innerHeight / 2 });
  };
  return <a href={href} onClick={handle} {...rest}>{children}</a>;
}
