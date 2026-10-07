// Organiske, lukkede former (til overgange, procesforløbet og kontaktens ramme). En ring af punkter, hvis radius
// varierer med glat støj; kurven lægges gennem punkterne som Catmull-Rom → kubiske béziers, så kanten aldrig får knæk.
const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const smoothNoise = (x: number, seed: number) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i + seed * 17.3) * (1 - u) + hash(i + 1 + seed * 17.3) * u;
};

export function blobPoints(cx: number, cy: number, r: number, t: number, opts: { n?: number; wobble?: number; seed?: number; stretch?: number; angle?: number } = {}) {
  const n = opts.n ?? 9, wob = opts.wobble ?? .22, seed = opts.seed ?? 1, st = opts.stretch ?? 1, ang = opts.angle ?? 0;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wob * ((smoothNoise(t + i * 1.7, seed + i) - .5) * 2) + wob * .5 * Math.sin(t * 1.3 + i * 2.1 + seed);
    let x = Math.cos(a) * r * k * st, y = Math.sin(a) * r * k / Math.sqrt(st);
    const c = Math.cos(ang), s = Math.sin(ang);
    [x, y] = [x * c - y * s, x * s + y * c];
    pts.push([cx + x, cy + y]);
  }
  return pts;
}

export function smoothClosedPath(pts: [number, number][]) {
  const n = pts.length; let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
}

export const blobPath = (cx: number, cy: number, r: number, t: number, opts?: Parameters<typeof blobPoints>[4]) => smoothClosedPath(blobPoints(cx, cy, r, t, opts));
