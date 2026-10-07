'use client';
// En lille etiket, der følger markøren over interaktive ting (VIEW, EXPLORE, OPEN). Den almindelige markør bliver,
// hvor den er — etiketten er kun en ekstra hilsen. Elementer med data-magnetic trækkes en anelse mod markøren.
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { finePointer, prefersReducedMotion } from '@/lib/motion';

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [on, setOn] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setLabel(''); }, [pathname]);

  useEffect(() => {
    if (!finePointer()) return;
    setOn(true);
    const reduce = prefersReducedMotion();
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0, mag: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      const t = e.target as Element | null;
      const c = t?.closest?.('[data-cursor]') as HTMLElement | null;
      setLabel(c?.dataset.cursor ?? '');
      const m = (t?.closest?.('[data-magnetic]') as HTMLElement | null) ?? null;
      if (mag && mag !== m) { mag.style.transform = ''; }
      mag = reduce ? null : m;
      if (mag) {
        const r = mag.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        mag.style.transform = `translate(${(dx * .22).toFixed(1)}px, ${(dy * .3).toFixed(1)}px)`;
      }
    };
    const leave = () => { setLabel(''); if (mag) mag.style.transform = ''; mag = null; };
    const frame = () => {
      x += (tx - x) * (reduce ? 1 : .2); y += (ty - y) * (reduce ? 1 : .2);
      if (ref.current) ref.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave); };
  }, []);

  if (!on) return null;
  return (
    <div ref={ref} className={`cursor${label ? ' is-on' : ''}`} aria-hidden="true">
      <span className="cursor-blob" />
      <span className="cursor-label">{label}</span>
    </div>
  );
}
