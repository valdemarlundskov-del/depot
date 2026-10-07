'use client';
// Starter et LIQUID-objekt i et lærred, men først når det er tæt på skærmen (three.js hentes også først der),
// pauser det, når det er ude af syne, og rydder op igen. Kan WebGL ikke startes, sættes fallback = true.
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { BlobOptions, BlobScene } from '@/lib/gl/blobScene';
import { supportsWebGL } from '@/lib/motion';

export function useBlobScene(canvas: RefObject<HTMLCanvasElement | null>, host: RefObject<HTMLElement | null>, opts: BlobOptions & { eager?: boolean }) {
  const scene = useRef<BlobScene | null>(null);
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cv = canvas.current, el = host.current;
    if (!cv || !el) return;
    if (!supportsWebGL()) { setFallback(true); return; }
    let dead = false, started = false, visible = false;
    const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    const boot = async () => {
      if (started) return; started = true;
      try {
        const { BlobScene } = await import('@/lib/gl/blobScene');
        if (dead) return;
        const s = new BlobScene(cv, { detail: coarse ? 'low' : 'high', dpr: coarse ? 1.5 : 1.75, ...opts });
        await s.warm();
        if (dead) { s.dispose(); return; }
        scene.current = s; setReady(true);
        s.setVisible(visible && !document.hidden);
      } catch (e) { console.warn('LIQUID: WebGL kunne ikke starte', e); setFallback(true); }
    };
    // to observatører: én starter objektet lidt før, det kommer ind på skærmen; den anden tegner kun, mens det faktisk ses
    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) boot(); }, { rootMargin: '400px 0px' });
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      scene.current?.setVisible(visible && !document.hidden);
    });
    near.observe(el); io.observe(el);
    const ro = new ResizeObserver(() => scene.current?.resize());
    ro.observe(cv);
    const vis = () => scene.current?.setVisible(visible && !document.hidden);
    document.addEventListener('visibilitychange', vis);
    if (opts.eager) boot();
    return () => {
      dead = true; io.disconnect(); near.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', vis);
      scene.current?.dispose(); scene.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { scene, fallback, ready };
}
