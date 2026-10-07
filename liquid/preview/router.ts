// Erstatning for next/navigation i den selvstændige preview (én HTML-side uden server).
// Ruten ligger i hukommelsen; et case-projekt kan deep-linkes med #case-<slug>.
import { useSyncExternalStore } from 'react';

const fromHash = () => { const h = location.hash.replace('#', ''); return h.startsWith('case-') ? `/work/${h.slice(5)}` : '/'; };
let path = typeof location !== 'undefined' ? fromHash() : '/';
const subs = new Set<() => void>();
const set = (p: string) => { if (p === path) return; path = p; subs.forEach(f => f()); };

export function usePathname() {
  return useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, () => path, () => path);
}
export function useRouter() {
  return {
    push(href: string) {
      const u = new URL(href, 'https://x.invalid');
      const slug = u.pathname.startsWith('/work/') ? u.pathname.slice(6) : '';
      try { history.replaceState(null, '', slug ? `#case-${slug}` : (u.hash || ' ')); } catch { /* ignoreres */ }
      set(u.pathname);
    },
  };
}
export function notFound(): never { throw new Error('not found'); }
