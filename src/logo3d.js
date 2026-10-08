/* BK Studio — BK-logoet i 3D.
   Logoet trækkes ud i 3D direkte fra images/logo/bk-blob.svg (afrundede kanter, blank "blæk"-overflade med refleksioner).

   1) Åbningen på forsiden ([data-thru]): ved start sidder 3D-logoet præcis i logo-vinduet (thru.js), set lige forfra. Når man scroller,
      glider det bagud ind i det sorte rum og snurrer (drejningen følger scroll), og det bliver der, til siden kommer op nedefra og dækker det. Den vokser langsommere end vinduet, så når man er kommet gennem logoet, svæver den
      midt i billedet; derefter toner den ud med et slør, og BK STUDIO kommer frem.
      Uden WebGL, eller hvis man har slået animationer fra, er vinduet bare showreelen.
   3) Rejsen gennem siden (alle sider; på undersiderne hentes filen først, når footeren eller karussellen nærmer sig): 3D-logoet følger med ned og ses på de sorte flader, og lander til sidst som logoet i footeren.
   2) <div class="logo3d" data-src="images/logo/bk-blob.svg" data-color="#141414"></div> giver et frit 3D-logo andre steder.

   Bygges til logo3d.min.js (med three.js indbygget) med esbuild:
     esbuild src/logo3d.js --bundle --minify --format=esm --outfile=logo3d.min.js */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, ExtrudeGeometry, MeshPhysicalMaterial,
  PMREMGenerator, DirectionalLight, SRGBColorSpace, ACESFilmicToneMapping, Color
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
function stage(canvas, color, keep) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!keep });
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
// 3D-logoet tegnes på sit eget (skjulte) lærred, og thru.js lægger det ind bag logo-vinduet sammen med showreelen,
// så man ser modellen snurre rundt inde bag logoet og zoomer forbi den, når man scroller gennem logoet.
function opening(sec) {
  const host = document.createElement('div'); host.className = 'thru-3d'; host.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); host.appendChild(canvas);
  sec.insertBefore(host, sec.firstChild);
  const html = document.documentElement;
  let st;
  try { st = stage(canvas, '#141414', true); } catch (e) { host.remove(); delete html.dataset.thru3d; return; }
  const { renderer, scene, camera, group } = st;
  const spacer = document.querySelector('[data-thru-spacer]');

  let vw = 0, vh = 0;
  function size() {
    vw = host.clientWidth; vh = host.clientHeight; if (!vw || !vh) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, vw < 700 ? 1.5 : 1.75)); renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  let half = 40, ready = false;
  const fail = () => { window.__thru3d = null; delete html.dataset.thru3d; };                 // kommer 3D ikke, er vinduet bare showreelen som før
  const giveUp = setTimeout(() => { if (!ready) fail(); }, 6000);
  loadLogo(st, 'images/logo/bk-blob.svg').then(h => { half = h; ready = true; clearTimeout(giveUp); kick(); }).catch(fail);


  function prog() {
    const T = window.__thru; if (T) return T.p;
    const r = spacer.getBoundingClientRect(); return clamp((innerHeight - r.top) / Math.max(1, r.height));
  }

  // modellen står stille og drejer kun, når man scroller: vinklen følger scroll-positionen (med en blød efterløb)
  let raf = 0, last = 0, ang = 0, sized = 0;
  addEventListener('resize', () => { sized++; kick(); });
  function frame(now) {
    raf = 0;
    const p = prog();
    if (!ready) { raf = requestAnimationFrame(frame); return; }
    if (p >= 1) { window.__thru3d = null; return; }                                          // siden har dækket åbningen: hvil
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
    const zp = smooth(p / .4), back = smooth(p / .3), tilt = smooth(p / .12), goal = -p * Math.PI * 6;   // snurrer samme vej som på resten af siden
    ang += (goal - ang) * (1 - Math.exp(-dt * 7));
    if (Math.abs(goal - ang) < 1e-4) ang = goal;

    // inde bag logoet: midt i vinduet, og vokser langsommere end vinduet (den ligger længere inde), så man zoomer forbi den
    const T = window.__thru, nar = vw < 700, asp = LWd / LHt;
    const bw = Math.min(vw * (nar ? .86 : .56), vh * (nar ? .5 : .66) * asp) * (T && T.g ? T.g : 1);
    const jw = Math.min(vw * (vw < 700 ? .7 : .42), 580);                                     // samme størrelse som på resten af siden (journey)
    const wpx = bw + (jw - bw) * back;                                                         // ved start: præcis logoets størrelse; går så direkte over i den faste størrelse
    const a = wpx * (VIS / vh) / LWd, s = a / (1 + a * half / CAMZ);
    group.scale.setScalar(s);
    const cx = T ? T.cx : vw / 2, cy = T ? T.cy : vh / 2, u = VIS / vh;
    group.position.set((cx - vw / 2) * u * (1 - zp), -(cy - vh / 2) * u * (1 - zp), 0);
    group.rotation.set(.16 * tilt, ang - .5 * tilt, .04 * tilt);                                 // lige forfra ved start (sidder i logoet); en lille skråvinkel, når den snurrer
    renderer.render(scene, camera);
    window.__thru3d = { canvas, ready: true };
    // tegn kun igen, mens noget ændrer sig (drejning eller logoets størrelse ved indlæsning)
    const key = [ang.toFixed(5), s.toFixed(6), group.position.x.toFixed(4), group.position.y.toFixed(4), sized].join();
    if (key !== frame.key) { frame.key = key; raf = requestAnimationFrame(frame); }
    else { last = 0; setTimeout(() => { if (!raf) raf = requestAnimationFrame(frame); }, 120); }
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

// ---------- 3) rejsen gennem forsiden ----------
// Efter åbningen følger 3D-logoet med ned gennem forsiden og står stille midt på skærmen, men ses kun på de sorte flader:
// i karussellen (som et plan midt i ringen: foran de bagerste kort, bag teksten og de forreste kort), i filmstriben (bag billederne)
// og i footeren. Der glider det ind fra footerens overkant, skifter fra sort til hvidt og lander midt i footerens store logo-felt,
// hvor det bliver til det flade logo; så glider "STUDIO" ind fra højre og skubber logoet ud på plads til venstre. Logoet renderes én gang pr. billede på et skjult lærred og kopieres ind i hver sorts flade.
function journey() {
  const targets = [];
  const add = (sec, parent, before, kind) => {
    if (!sec || !parent) return;
    const cv = document.createElement('canvas'); cv.className = 'bk3d-layer bk3d-' + kind; cv.setAttribute('aria-hidden', 'true');
    parent.insertBefore(cv, before || null); targets.push({ sec, cv, ctx: cv.getContext('2d'), vis: false, kind });
  };
  const w3 = document.querySelector('.w3d'), ring = w3 && w3.querySelector('.w3d-stage');
  add(w3, ring, ring && ring.firstChild, 'ring');
  const strip = document.querySelector('.strip'); add(strip, strip, strip && strip.firstChild, 'strip');
  const foot = document.querySelector('footer'); add(foot, foot, foot && foot.firstChild, 'foot');
  if (!targets.length) return;
  const gl = document.createElement('canvas');
  let st; try { st = stage(gl, '#141414', true); } catch (e) { targets.forEach(x => x.cv.remove()); return; }
  const { renderer, scene, camera, group } = st;
  const html = document.documentElement, C0 = new Color('#141414'), C1 = new Color('#f7f7f5');
  let half = 40, mat = null, vw = 0, vh = 0, dpr = 1, raf = 0, ang = 0, last = 0;

  let spreadT = 0, done = false, spreading = false, sk = 0, dxF = 0, x0F = 0;

  function size() {
    vw = innerWidth; vh = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
    targets.forEach(x => { const r = x.sec.getBoundingClientRect(); x.cv.width = Math.round(r.width * dpr); x.cv.height = Math.round(r.height * dpr); });
    kick();
  }
  function frame(now) {
    raf = 0; if (!mat) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
    // fod: hvor langt er man nået ned mod BK-logoet i footeren (1 = landet)
    const fm = document.querySelector('.foot-mega .fm-blob'), mega = fm && fm.parentElement;
    let t = 0, br = null, mx = 0;
    if (fm) {
      br = fm.getBoundingClientRect(); const mr = mega.getBoundingClientRect(); mx = mr.left + mr.width / 2;
      const maxS = document.documentElement.scrollHeight - vh, endTop = br.top - (maxS - scrollY) + 30, start = vh * 1.05;
      t = smooth((start - br.top) / Math.max(1, start - endTop));
    }
    const goal = -scrollY * .0024;                                     // drejer kun, når man scroller (samme retning som i åbningen)
    ang += (goal - ang) * (1 - Math.exp(-dt * 7)); if (Math.abs(goal - ang) < 1e-4) ang = goal;
    const baseW = Math.min(vw * (vw < 700 ? .7 : .42), 580);
    // når footeren kommer op nedefra, følger logoet med i footerens synlige del (så det ikke gemmer sig bag den lyse flade ovenover)
    // midt på skærmen; når footeren kommer op, kigger logoet først frem under footerens overkant og glider så ned i den
    const fr = foot ? foot.getBoundingClientRect().top : vh, ent = smooth((vh - fr) / (vh * .55));
    const baseY = fr < vh ? Math.max(vh / 2, fr + baseW * (-.32 + .92 * ent)) : vh / 2;
    const cx = br ? vw / 2 + (mx - vw / 2) * t : vw / 2, cy = br ? baseY + (br.top + br.height / 2 - baseY) * t : baseY;
    const wpx = baseW + ((br ? br.width : baseW) - baseW) * t;
    const a = wpx * (VIS / vh) / LWd, s = a / (1 + a * half / CAMZ), u = VIS / vh;
    group.scale.setScalar(s); group.position.set((cx - vw / 2) * u, -(cy - vh / 2) * u, 0);
    const front = Math.round(ang / (Math.PI * 2)) * Math.PI * 2;      // lander lige forfra
    group.rotation.set(.16 * (1 - t), ang + (front - ang) * t - .5 * (1 - t), .04 * (1 - t));
    mat.color.lerpColors(C0, C1, smooth((t - .35) / .5));               // sort på vej ned, hvidt når det lander i den sorte footer
    renderer.render(scene, camera);
    // landing: logoet lander midt i feltet og bliver til det flade logo. Så glider "STUDIO" ind fra højre i én bevægelse; når teksten
    // rammer logoet, skubber den det med ud på plads til venstre uden at stoppe. Derefter bliver det stående, også når man scroller op;
    // først når logoet er helt ude af syne, nulstilles det, så animationen kører forfra næste gang man kommer ned.
    const land = t > .985;
    if (done && br && br.top > vh + 20) { done = false; sk = 0; clearTimeout(spreadT); }
    if (land && !done && fm) {
      done = true; sk = 0;
      dxF = mega.clientWidth / 2 - (fm.offsetLeft + fm.offsetWidth / 2);
      x0F = vw * 1.1;                                                      // "STUDIO" starter helt ude til højre
      clearTimeout(spreadT); spreadT = setTimeout(() => { spreading = true; kick(); }, 280);
    }
    if (!done) spreading = false;
    if (spreading && sk < 1) sk = Math.min(1, sk + dt / 1.9);
    if (foot) foot.classList.toggle('fm-landed', done);
    if (fm) {
      const e = sk < .5 ? 4 * sk * sk * sk : 1 - Math.pow(-2 * sk + 2, 3) / 2;   // blød start og slutning, fuld fart når teksten rammer logoet
      const X = x0F * (1 - e), bx = Math.min(dxF, X);                     // logoet flytter sig først, når teksten skubber til det
      const word = mega.querySelector('.fm-word');
      fm.style.transform = done ? 'translateX(' + bx.toFixed(1) + 'px)' : '';
      if (word) { word.style.transform = done ? 'translateX(' + X.toFixed(1) + 'px)' : ''; word.style.opacity = done && spreading ? '1' : ''; }
    }
    const fade = done ? 0 : 1 - smooth((t - .93) / .06);                 // modellen går over i det flade logo
    targets.forEach(x => {
      if (!x.vis) return;
      const r = x.sec.getBoundingClientRect(), c = x.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, x.cv.width, x.cv.height);
      c.globalAlpha = x.kind === 'foot' ? fade : 1;
      if (c.globalAlpha > .003) c.drawImage(gl, -r.left * dpr, -r.top * dpr, vw * dpr, vh * dpr);
      c.globalAlpha = 1;
    });
    if (ang !== goal || (spreading && sk < 1)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && targets.some(x => x.vis)) { last = 0; raf = requestAnimationFrame(frame); } }
  const io = new IntersectionObserver(es => { es.forEach(e => { const x = targets.find(y => y.sec === e.target); if (x) x.vis = e.isIntersecting; }); kick(); }, { rootMargin: '60px 0px' });
  targets.forEach(x => io.observe(x.sec));
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', size);
  if ('ResizeObserver' in window) { let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(size, 120); }).observe(document.body); }
  loadLogo(st, 'images/logo/bk-blob.svg').then(h => {
    half = h; mat = group.children[0].material; html.classList.add('bk3d-on'); size();
  }).catch(() => { targets.forEach(x => x.cv.remove()); });
}

const thruSec = document.querySelector('[data-thru]');
if (!reduce) { if (thruSec) opening(thruSec); journey(); }        // rejsen (og landingen i footeren) på alle sider, åbningen kun på forsiden
document.querySelectorAll('.logo3d').forEach(free);
