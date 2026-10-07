/* BK Studio — BK-logoet i 3D.
   Logoet trækkes ud i 3D direkte fra images/logo/bk-blob.svg (afrundede kanter, blank "blæk"-overflade med refleksioner).

   1) Åbningen på forsiden ([data-thru]): siden starter lys med 3D-logoet, der drejer ind fra slør, svæver og følger musen
      (man kan også dreje det med musen). Når man begynder at scrolle, drejer logoet sig lige mod kameraet i midten og sløres
      derefter ud, mens det vokser mod en, og thru.js toner den lyse baggrund over i showreelen i fuld skærm (html[data-thru3d]).
      Uden WebGL, eller hvis man har slået animationer fra, kører den almindelige åbning gennem logoet.
   2) <div class="logo3d" data-src="images/logo/bk-blob.svg" data-color="#141414"></div> giver et frit 3D-logo andre steder.

   Bygges til logo3d.min.js (med three.js indbygget) med esbuild:
     esbuild src/logo3d.js --bundle --minify --format=esm --outfile=logo3d.min.js */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, ExtrudeGeometry, MeshPhysicalMaterial,
  PMREMGenerator, DirectionalLight, SRGBColorSpace, ACESFilmicToneMapping
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const ease = t => 1 - Math.pow(1 - clamp(t), 4);
const LWd = 839.7, LHt = 724.3;                       // logoets viewBox (samme mål som i thru.js)
const FOV = 28, CAMZ = 10, VIS = 2 * CAMZ * Math.tan(FOV / 2 * Math.PI / 180);   // synlig højde (enheder) ved z = 0

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

// ---------- 1) åbningen ----------
function opening(sec) {
  const host = document.createElement('div'); host.className = 'thru-3d'; host.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); host.appendChild(canvas);
  sec.insertBefore(host, sec.querySelector('.thru-title'));
  sec.classList.add('has-3d');
  let st;
  try { st = stage(canvas, '#141414'); } catch (e) { host.remove(); sec.classList.remove('has-3d'); delete document.documentElement.dataset.thru3d; return; }
  const { renderer, scene, camera, group } = st;
  const spacer = document.querySelector('[data-thru-spacer]');

  let vw = 0, vh = 0;
  function size() {
    vw = host.clientWidth; vh = host.clientHeight; if (!vw || !vh) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, vw < 700 ? 1.5 : 2)); renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  let half = 40, ready = false, t0 = 0;
  const html = document.documentElement;
  const fail = () => { host.classList.add('gone'); delete html.dataset.thru3d; };             // kommer 3D ikke, kører den almindelige åbning (gennem logoet)
  const giveUp = setTimeout(() => { if (!ready) fail(); }, 4500);
  loadLogo(st, 'images/logo/bk-blob.svg').then(h => { half = h; ready = true; clearTimeout(giveUp); kick(); }).catch(fail);

  // mus: hældning + træk for at dreje
  let tx = 0, ty = 0, px = 0, py = 0, spin = 0, vel = 0, drag = null;
  sec.addEventListener('pointermove', e => {
    tx = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1); ty = clamp((e.clientY / innerHeight) * 2 - 1, -1, 1);
    if (drag && e.pointerType === 'mouse') { const dx = e.clientX - drag; drag = e.clientX; vel = dx * .006; spin += vel; }
  });
  sec.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && !e.target.closest('a,button')) { drag = e.clientX; sec.classList.add('grabbing'); } });
  const up = () => { drag = null; sec.classList.remove('grabbing'); };
  addEventListener('pointerup', up);

  function prog() {
    const T = window.__thru; if (T) return T.p;
    const r = spacer.getBoundingClientRect(); return clamp((innerHeight - r.top) / Math.max(1, r.height));
  }

  let raf = 0, last = 0;
  function frame(now) {
    raf = 0;
    const p = prog();
    // når man scroller: logoet drejer sig lige mod kameraet i midten (q) og sløres derefter ud, mens det vokser mod en (d).
    // Imens toner thru.js den lyse baggrund over i showreelen i fuld skærm.
    const q = smooth(p / .06), d = smooth((p - .04) / .16);
    host.style.opacity = (1 - d).toFixed(3);
    host.classList.toggle('off', d >= 1);
    if (d >= 1 || !ready) { if (!ready) raf = requestAnimationFrame(frame); return; }
    if (!t0) t0 = now;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
    const t = now / 1000, intro = ease((now - t0) / 1900);
    px += (tx - px) * (1 - Math.exp(-dt * 3.5)); py += (ty - py) * (1 - Math.exp(-dt * 3.5));
    if (!drag) { spin += vel; vel *= Math.exp(-dt * 2.2); }
    if (q > 0 && !drag) { const home = Math.round(spin / (Math.PI * 2)) * Math.PI * 2; spin += (home - spin) * Math.min(1, q * .25); vel *= 1 - q; }

    // størrelse: midt på skærmen, lidt større når det står lige, og vokser mod en, mens det sløres ud
    const nar = vw < 700, asp = LWd / LHt;
    const wpx = Math.min(vw * (nar ? .86 : .56), vh * (nar ? .5 : .66) * asp) * .9 * (1 + .1 * q) * (1 + .7 * d * d);
    const bob = (1 - q) * Math.sin(t * .9) * .06;
    const a = wpx * (VIS / vh) / LWd, s = a / (1 + a * half / CAMZ);
    group.scale.setScalar(s * (.7 + .3 * intro));
    group.position.set(0, bob, 0);
    const free = 1 - q;
    group.rotation.y = free * ((1 - intro) * -2.6 + Math.sin(t * .45) * .42 + px * .5) + spin + d * .35;
    group.rotation.x = free * ((1 - intro) * .6 + py * .3 + Math.sin(t * .6) * .06) - d * .12;
    group.rotation.z = free * Math.sin(t * .35) * .035;
    // slør: når logoet drejer ind ved start, når det drejes hurtigt, og når det sløres ud ved scroll
    const blur = Math.min(48, Math.abs(vel) * 260 + (1 - intro) * 14 + d * 40);
    canvas.style.filter = blur > .3 ? 'blur(' + blur.toFixed(1) + 'px)' : '';
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  addEventListener('scroll', kick, { passive: true });
  kick();
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
  loadLogo(st, host.dataset.src || 'images/logo/bk-blob.svg').then(() => { group.scale.set(4.2 / LWd, 4.2 / LWd, 4.2 / LWd); ready = true; host.classList.add('logo3d-ready'); kick(); })
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

const thruSec = document.querySelector('[data-thru]');
if (thruSec && !reduce) opening(thruSec);
document.querySelectorAll('.logo3d').forEach(free);
