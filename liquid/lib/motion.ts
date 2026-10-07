'use client';
import { useEffect, useState } from 'react';

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setR(m.matches); on();
    m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  return r;
}

export function supportsWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
