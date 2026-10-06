/* BK Studio — BK-logoet i 3D.
   Logoet trækkes ud i 3D direkte fra images/logo/bk-blob.svg (afrundede kanter, blank "blæk"-overflade med refleksioner).
   Det svæver let og drejer langsomt, følger musen, kan trækkes rundt med musen/fingeren og får bevægelsesslør, når det drejer hurtigt.
   Første gang det kommer ind på skærmen, drejer det ind fra slør. Det tegnes kun, mens det er på skærmen.

   Brug: <div class="logo3d" data-src="images/logo/bk-blob.svg" data-color="#141414"></div>
   Bygges til logo3d.min.js (med three.js indbygget) med esbuild:
     esbuild src/logo3d.js --bundle --minify --format=esm --outfile=logo3d.min.js */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, ExtrudeGeometry, MeshPhysicalMaterial,
  PMREMGenerator, DirectionalLight, SRGBColorSpace, ACESFilmicToneMapping
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - t, 4);

function init(host) {
  const canvas = document.createElement('canvas'); canvas.className = 'logo3d-canvas'; canvas.setAttribute('aria-hidden', 'true');
  const shadow = document.createElement('div'); shadow.className = 'logo3d-shadow'; shadow.setAttribute('aria-hidden', 'true');
  host.appendChild(shadow); host.appendChild(canvas);

  let renderer;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { host.classList.add('logo3d-fallback'); return; }                          // ingen WebGL: CSS viser det flade logo i stedet
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const camera = new PerspectiveCamera(28, 1, .1, 100); camera.position.set(0, 0, 10);
  const key = new DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 6); scene.add(key);
  const rim = new DirectionalLight(0xffffff, .8); rim.position.set(-5, -2, -4); scene.add(rim);
  const group = new Group(); scene.add(group);

  // størrelse
  function size() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    dirty = true;
  }

  // logoet: SVG → flader → udtrukket 3D-form
  let ready = false;
  fetch(host.dataset.src || 'images/logo/bk-blob.svg').then(r => r.text()).then(txt => {
    const data = new SVGLoader().parse(txt), shapes = [];
    data.paths.forEach(p => SVGLoader.createShapes(p).forEach(s => shapes.push(s)));
    const geo = new ExtrudeGeometry(shapes, { depth: 70, bevelEnabled: true, bevelThickness: 16, bevelSize: 10, bevelSegments: 10, curveSegments: 40 });
    geo.center(); geo.computeBoundingBox();
    const bw = geo.boundingBox.max.x - geo.boundingBox.min.x, s = 4.2 / bw;
    const mat = new MeshPhysicalMaterial({ color: host.dataset.color || '#141414', metalness: .15, roughness: .26, clearcoat: 1, clearcoatRoughness: .12 });
    const mesh = new Mesh(geo, mat); mesh.scale.set(s, -s, s);                              // SVG har y nedad
    group.add(mesh); ready = true; t0 = 0; dirty = true;
    host.classList.add('logo3d-ready');
  }).catch(() => host.classList.add('logo3d-fallback'));

  // mus og træk
  let px = 0, py = 0, tx = 0, ty = 0, spin = 0, vel = 0, drag = null;
  addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    tx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1.5, 1.5);
    ty = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1.5, 1.5);
    if (drag) { const dx = e.clientX - drag.x; drag.x = e.clientX; vel = dx * .006; spin += vel; }
  }, { passive: true });
  host.addEventListener('pointerdown', e => { drag = { x: e.clientX }; host.classList.add('grabbing'); host.setPointerCapture && host.setPointerCapture(e.pointerId); });
  const up = () => { drag = null; host.classList.remove('grabbing'); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);

  // tegning
  let vis = false, raf = 0, t0 = 0, last = 0, dirty = true;
  function frame(now) {
    raf = 0;
    if (!vis) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
    if (ready) {
      if (!t0) t0 = now;
      const intro = reduce ? 1 : ease(clamp((now - t0) / 1600, 0, 1)), t = now / 1000;
      px += (tx - px) * (1 - Math.exp(-dt * 4)); py += (ty - py) * (1 - Math.exp(-dt * 4));
      if (!drag) { spin += vel; vel *= Math.exp(-dt * 2.2); }                               // træk har lidt efterløb
      const idle = reduce ? 0 : Math.sin(t * .45) * .38;
      group.rotation.y = (1 - intro) * -2.4 + idle + px * .45 + spin;
      group.rotation.x = (1 - intro) * .5 + py * .28 + (reduce ? 0 : Math.sin(t * .6) * .05);
      group.rotation.z = reduce ? 0 : Math.sin(t * .35) * .03;
      const bob = reduce ? 0 : Math.sin(t * .9) * .08;
      group.position.y = bob; group.scale.setScalar(.7 + .3 * intro);
      // bevægelsesslør, når logoet drejer hurtigt eller er på vej ind
      const blur = Math.min(10, Math.abs(vel) * 260 + (1 - intro) * 12);
      canvas.style.filter = blur > .3 ? 'blur(' + blur.toFixed(1) + 'px)' : '';
      shadow.style.transform = 'translateX(-50%) scale(' + (1 - bob * .9).toFixed(3) + ',1)';
      shadow.style.opacity = (intro * (.9 - bob * 2)).toFixed(3);
      renderer.render(scene, camera); dirty = false;
    }
    if (!reduce || dirty || !ready) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) kick(); }, { rootMargin: '80px' }).observe(host);
  new ResizeObserver(() => { size(); kick(); }).observe(host);
  size();
}

document.querySelectorAll('.logo3d').forEach(init);
