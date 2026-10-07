// Bygger symbolet som en tyk, oppustet blækmasse: SVG-formen ekstruderes med blød afrunding, deles op i små trekanter
// (så den kan deformeres glat i shaderen), og forsiden/bagsiden pustes op efter afstanden til kanten — som tyk maling,
// der har sat sig. Tykke partier bliver høje, tynde halse og dråberne bliver lave.
import { BufferGeometry, ExtrudeGeometry, Shape, Vector2, Vector3 } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SYMBOL_PATH, SYMBOL_VIEWBOX } from '../symbol';

export type SymbolGeometry = { geometry: BufferGeometry; centers: Vector3[]; size: Vector3 };

export function buildSymbolGeometry(opts: { width?: number; detail?: 'high' | 'low' } = {}): SymbolGeometry {
  const width = opts.width ?? 2.4;
  const high = opts.detail !== 'low';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SYMBOL_VIEWBOX}"><path fill-rule="evenodd" d="${SYMBOL_PATH}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes: Shape[] = [];
  data.paths.forEach(p => shapes.push(...p.toShapes()));

  // kanten som linjestykker (til afstandsberegningen)
  const segs: number[] = [];
  const addLoop = (pts: Vector2[]) => {
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; segs.push(a.x, a.y, b.x, b.y); }
  };
  shapes.forEach(s => { const e = s.extractPoints(6); addLoop(e.shape); e.holes.forEach(addLoop); });

  const depth = 34, bt = 30, bs = 20;
  let g: BufferGeometry = new ExtrudeGeometry(shapes, {
    depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelOffset: 0,
    bevelSegments: high ? 10 : 6, curveSegments: high ? 28 : 14,
  });
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g = new TessellateModifier(high ? 13 : 22, 24).modify(g);         // deler indtil ingen kant er længere end grænsen
  g = mergeVertices(g, 0.01);

  // pust forsiden og bagsiden op
  const pos = g.getAttribute('position');
  const zFront = depth + bt, zBack = -bt, A = 58, L = 64;
  const n = segs.length / 4;
  const dist = (x: number, y: number) => {
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      const ax = segs[i * 4], ay = segs[i * 4 + 1], bx = segs[i * 4 + 2], by = segs[i * 4 + 3];
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1e-6;
      let t = ((x - ax) * dx + (y - ay) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = ax + dx * t - x, ey = ay + dy * t - y, d2 = ex * ex + ey * ey;
      if (d2 < best) best = d2;
    }
    return Math.sqrt(best);
  };
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const front = z > zFront - 0.01, back = z < zBack + 0.01;
    if (!front && !back) continue;
    const d = dist(pos.getX(i), pos.getY(i)), f = A * (1 - Math.exp(-(d / L) * (d / L)));
    pos.setZ(i, front ? z + f : z - f);
  }

  g.computeBoundingBox();
  const c = new Vector3(); g.boundingBox!.getCenter(c);
  g.translate(-c.x, -c.y, -c.z);
  const s = width / (g.boundingBox!.max.x - g.boundingBox!.min.x);
  g.scale(s, -s, -s);                                   // SVG har y nedad; y og z vendes begge, så trekanterne vender rigtigt
  g.computeVertexNormals();
  g.computeBoundingBox(); g.computeBoundingSphere();
  const size = new Vector3(); g.boundingBox!.getSize(size);

  // centre til opløsning i dråber: spredt ud over formen (farthest point sampling)
  const N = 10, centers: Vector3[] = [], v = new Vector3(), tmp = new Vector3();
  const minD = new Float32Array(pos.count).fill(Infinity);
  let pick = 0;
  for (let k = 0; k < N; k++) {
    const cc = new Vector3().fromBufferAttribute(pos, pick); cc.z *= 0.2; centers.push(cc);
    let far = 0, farI = 0;
    for (let i = 0; i < pos.count; i += 3) {
      v.fromBufferAttribute(pos, i); const d = v.distanceToSquared(tmp.copy(cc));
      if (d < minD[i]) minD[i] = d;
      if (minD[i] > far) { far = minD[i]; farI = i; }
    }
    pick = farI;
  }
  return { geometry: g, centers, size };
}
