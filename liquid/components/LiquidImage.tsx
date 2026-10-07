'use client';
// Et projektbillede. Altid et rigtigt <img> (alt-tekst, lazy loading, virker uden JS); på enheder med mus overtager
// det fælles WebGL-lærred tegningen og tilføjer den flydende hover og opstigningen nedefra.
import { useEffect, useRef, type CSSProperties } from 'react';
import type { Img } from '@/content/projects';
import { finePointer, prefersReducedMotion } from '@/lib/motion';

type Props = { img: Img; alt2?: Img; sizes?: string; priority?: boolean; className?: string; style?: CSSProperties; reveal?: boolean };

export function LiquidImage({ img, alt2, sizes = '100vw', priority, className = '', style, reveal = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || !finePointer() || prefersReducedMotion()) return;
    let dead = false, done: (() => void) | null = null;
    import('@/lib/gl/liquidStage').then(({ getLiquidStage }) => {          // three.js hentes først her
      const stage = getLiquidStage(); if (!stage || dead) return;
      const big = el.clientWidth * Math.min(devicePixelRatio || 1, 1.5) > 860;
      stage.add(el, big ? img.src : img.sm, alt2 ? (big ? alt2.src : alt2.sm) : undefined);
      done = () => stage.remove(el);
    });
    return () => { dead = true; done?.(); };
  }, [img, alt2]);
  return (
    <div ref={ref} className={`lq ${className}`} style={style} data-reveal={reveal ? '' : undefined}>
      <img
        src={img.sm} srcSet={`${img.sm} 900w, ${img.src} 2000w`} sizes={sizes} alt={img.alt}
        width={img.w} height={img.h} loading={priority ? 'eager' : 'lazy'} decoding="async"
        fetchPriority={priority ? 'high' : undefined}
      />
    </div>
  );
}
