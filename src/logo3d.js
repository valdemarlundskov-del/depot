/* BK Studio — BK-logoet i 3D.
   Logoet trækkes ud i 3D direkte fra images/logo/bk-blob.svg (afrundede kanter, blank overflade med refleksioner og blød skygge).
   Det svæver, drejer langsomt, følger musen, kan trækkes rundt og får bevægelsesslør ved hurtige drej; første gang drejer det ind fra slør.
   Brug: <div class="logo3d" data-src="/images/logo/bk-blob.svg" data-color="#efe9df"></div>. Hentes af assets/bk.js, når det nærmer sig skærmen.
   Bygges til assets/logo3d.js (med three.js indbygget) — se tools/README.md. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, ExtrudeGeometry, MeshPhysicalMaterial,
  PMREMGenerator, DirectionalLight, SRGBColorSpace, ACESFilmicToneMapping
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - clamp(t), 4);
const LWd = 839.7, LHt = 724.3;                       // logoets viewBox
const FOV = 28, CAMZ = 10;

// fælles: renderer, lys og selve logoet. Geometrien er i SVG-enheder, centreret om viewBox'ens midte og om sin dybde.
function stage(canvas, color) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new Scene();
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  const camera = new PerspectiveCamera(FOV, 1, .1, 100); camera.position.set(0, 0, CAMZ);
  const key = new DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 6); scene.add(key);
  const rim = new DirectionalLight(0xffffff, .8); rim.position.set(-5, -2, -4); scene.add(rim);
  const group = new Group(); scene.add(group);
  return { renderer, scene, camera, group, color };
}
function loadLogo(st, src) {
  return fetch(src).then(r => r.text()).then(txt => {
    const data = new SVGLoader().parse(txt), shapes = [];
    data.paths.forEach(p => SVGLoader.createShapes(p).forEach(s => shapes.push(s)));
    const geo = new ExtrudeGeometry(shapes, { depth: 70, bevelEnabled: true, bevelThickness: 16, bevelSize: 8, bevelSegments: 10, curveSegments: 40 });
    geo.computeBoundingBox();
    const zc = (geo.boundingBox.min.z + geo.boundingBox.max.z) / 2, half = geo.boundingBox.max.z - zc;
    geo.translate(-LWd / 2, -LHt / 2, -zc);
    const mat = new MeshPhysicalMaterial({ color: st.color, metalness: .15, roughness: .26, clearcoat: 1, clearcoatRoughness: .12 });
    const mesh = new Mesh(geo, mat); mesh.scale.set(1, -1, 1);                               // SVG har y nedad
    st.group.add(mesh);
    return half;                                                                              // halv tykkelse (SVG-enheder)
  });
}

// ---------- 2) frit 3D-logo ----------
function free(host) {
  const canvas = document.createElement('canvas'); canvas.className = 'logo3d-canvas'; canvas.setAttribute('aria-hidden', 'true');
  const shadow = document.createElement('div'); shadow.className = 'logo3d-shadow'; shadow.setAttribute('aria-hidden', 'true');
  host.appendChild(shadow); host.appendChild(canvas);
  let st;
  try { st = stage(canvas, host.dataset.color || '#141414'); } catch (e) { host.classList.add('logo3d-fallback'); return; }
  const { renderer, scene, camera, group } = st;
  function size() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  let ready = false;
  loadLogo(st, host.dataset.src || '/images/logo/bk-blob.svg').then(() => { group.scale.set(4.2 / LWd, 4.2 / LWd, 4.2 / LWd); ready = true; host.classList.add('logo3d-ready'); kick(); })
    .catch(() => host.classList.add('logo3d-fallback'));
  let px = 0, py = 0, tx = 0, ty = 0, spin = 0, vel = 0, drag = null;
  addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    tx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1.5, 1.5); ty = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1.5, 1.5);
    if (drag) { const dx = e.clientX - drag; drag = e.clientX; vel = dx * .006; spin += vel; }
  }, { passive: true });
  host.addEventListener('pointerdown', e => { drag = e.clientX; host.classList.add('grabbing'); });
  addEventListener('pointerup', () => { drag = null; host.classList.remove('grabbing'); });
  let vis = false, raf = 0, t0 = 0, last = 0;
  function frame(now) {
    raf = 0; if (!vis) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
    if (ready) {
      if (!t0) t0 = now;
      const intro = reduce ? 1 : ease((now - t0) / 1600), t = now / 1000;
      px += (tx - px) * (1 - Math.exp(-dt * 4)); py += (ty - py) * (1 - Math.exp(-dt * 4));
      if (!drag) { spin += vel; vel *= Math.exp(-dt * 2.2); }
      group.rotation.y = (1 - intro) * -2.4 + (reduce ? 0 : Math.sin(t * .45) * .38) + px * .45 + spin;
      group.rotation.x = (1 - intro) * .5 + py * .28;
      const bob = reduce ? 0 : Math.sin(t * .9) * .08; group.position.y = bob;
      const blur = Math.min(10, Math.abs(vel) * 260 + (1 - intro) * 12);
      canvas.style.filter = blur > .3 ? 'blur(' + blur.toFixed(1) + 'px)' : '';
      shadow.style.transform = 'translateX(-50%) scale(' + (1 - bob * .9).toFixed(3) + ',1)'; shadow.style.opacity = (intro * (.9 - bob * 2)).toFixed(3);
      renderer.render(scene, camera);
    }
    if (!reduce || !ready) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) kick(); }, { rootMargin: '80px' }).observe(host);
  new ResizeObserver(() => { size(); kick(); }).observe(host);
  size();
}

document.querySelectorAll('.logo3d').forEach(free);
