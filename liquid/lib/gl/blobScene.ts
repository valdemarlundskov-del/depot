// LIQUID-objektet: symbolet som et fysisk stof i et mørkt studie. Ét objekt, mange tilstande — blæk, våd maling,
// chrome, glas og gel — og en shader, der lader det bevæge sig som noget, der hænger i en tyktflydende væske.
// Ingen væskesimulering: al bevægelse er en glat deformation af én mesh (billig, stabil, og formen er altid genkendelig).
import {
  ACESFilmicToneMapping, BackSide, BoxGeometry, CanvasTexture, Color, Group, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Raycaster, Scene, SRGBColorSpace,
  Texture, Vector2, Vector3, Vector4, WebGLRenderer,
} from 'three';
import { SNOISE } from './noise';
import { buildSymbolGeometry } from './symbolGeometry';

import type { MaterialName } from './materials';
export type { MaterialName } from './materials';

type Params = {
  r: number; g: number; b: number; metalness: number; roughness: number; clearcoat: number; clearcoatRoughness: number;
  transmission: number; thickness: number; iridescence: number; sheen: number; env: number; amp: number; dispersion: number;
};
const P: Record<MaterialName, Params> = {
  ink:    { r: .012, g: .012, b: .014, metalness: 0, roughness: .92, clearcoat: 0, clearcoatRoughness: .5, transmission: 0, thickness: 0, iridescence: 0, sheen: 0, env: .6, amp: .018, dispersion: 0 },
  wet:    { r: .006, g: .006, b: .007, metalness: 0, roughness: .34, clearcoat: 1, clearcoatRoughness: .035, transmission: 0, thickness: 0, iridescence: 0, sheen: 0, env: 1.7, amp: .022, dispersion: 0 },
  chrome: { r: .96, g: .95, b: .93, metalness: 1, roughness: .055, clearcoat: .4, clearcoatRoughness: .05, transmission: 0, thickness: 0, iridescence: .55, sheen: 0, env: 1.35, amp: .02, dispersion: 0 },
  glass:  { r: 1, g: 1, b: 1, metalness: 0, roughness: .03, clearcoat: 1, clearcoatRoughness: .02, transmission: 1, thickness: .9, iridescence: .15, sheen: 0, env: 1.1, amp: .024, dispersion: 5 },
  gel:    { r: .05, g: .052, b: .06, metalness: 0, roughness: .48, clearcoat: .6, clearcoatRoughness: .25, transmission: 0, thickness: 0, iridescence: 0, sheen: 1, env: .9, amp: .06, dispersion: 0 },
};

export type BlobOptions = {
  detail?: 'high' | 'low';
  intro?: boolean;              // vokser frem af en lille mørk masse
  backdrop?: boolean;           // tekst bag objektet, som glasset kan bryde
  interactive?: boolean;        // træk for at dreje, klik for at deformere
  offset?: boolean;             // ryk objektet til højre på brede skærme (hero)
  material?: MaterialName;
  dpr?: number;
  onReady?: () => void;
};

const N_CENTERS = 10;

export class BlobScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(32, 1, .1, 50);
  private group = new Group();
  private spin = new Group();
  private mesh: Mesh;
  private mat: MeshPhysicalMaterial;
  private last = 0;
  private baseX = 0;
  private baseS = 1;
  private baseY = 0;
  private raf = 0;
  private running = false;
  private cur: Params;
  private target: Params;
  private u = {
    uTime: { value: 0 }, uAmp: { value: .02 }, uMelt: { value: 0 }, uRadius: { value: .32 }, uPull: { value: 0 },
    uPointer: { value: new Vector3(9, 9, 9) }, uImpulse: { value: new Vector4(0, 0, 0, 0) }, uImpulseT: { value: 10 },
    uExplode: { value: 0 }, uCenters: { value: [] as Vector3[] }, uDirs: { value: [] as Vector4[] },
  };
  // tilstand
  private pointer = new Vector2(0, 0);
  private pointerS = new Vector2(0, 0);
  private hover = 0;
  private dragging = false;
  private rotVel = new Vector2(0, 0);
  private rot = new Vector2(0, 0);
  private explodeTarget = 0;
  private explodeVel = 0;
  private meltVel = 0;
  private introT = -1;
  private scrollMix = 0;
  private envRot = 0;
  private visible = true;
  private disposeFns: (() => void)[] = [];
  private raycaster = new Raycaster();

  constructor(private canvas: HTMLCanvasElement, private opts: BlobOptions = {}) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.dpr ?? 1.75));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);

    this.scene.environment = this.studioEnvironment();
    this.camera.position.set(0, 0, 6.2);

    const { geometry, centers } = buildSymbolGeometry({ detail: opts.detail });
    this.u.uCenters.value = centers;
    this.u.uDirs.value = centers.map((c, i) => {
      const a = Math.sin(i * 12.9898) * 43758.5453, r = a - Math.floor(a);
      const d = new Vector3(c.x, c.y, (r - .5) * 1.6).normalize().multiplyScalar(.7 + r * .9);
      d.y += (r - .5) * .5;
      return new Vector4(d.x, d.y, d.z, .16 + r * .12);
    });

    this.cur = { ...P[opts.material ?? 'wet'] };
    this.target = { ...this.cur };
    this.mat = new MeshPhysicalMaterial({ envMapIntensity: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [180, 820], sheenRoughness: .35, sheenColor: new Color(0x8a8f99), ior: 1.5, attenuationDistance: 2.4, attenuationColor: new Color(0xf3f1ea) });
    this.applyParams();
    this.mat.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.u);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
          uniform float uTime, uAmp, uMelt, uRadius, uPull, uImpulseT, uExplode;
          uniform vec3 uPointer; uniform vec4 uImpulse;
          uniform vec3 uCenters[${N_CENTERS}]; uniform vec4 uDirs[${N_CENTERS}];
          ${SNOISE}
          vec3 liquidDeform(vec3 p, vec3 n){
            vec3 q = p;
            if (uExplode > 0.001) {                       // opløses i dråber, der hænger sammen i tynde tråde
              vec3 acc = vec3(0.0); float ws = 0.0;
              for (int i = 0; i < ${N_CENTERS}; i++) {
                vec3 d = p - uCenters[i]; float w = exp(-dot(d, d) * 26.0);
                float L = length(d) + 1e-4;
                vec3 local = mix(d, d / L * min(L, uDirs[i].w), uExplode * 0.9);
                acc += (uCenters[i] + uDirs[i].xyz * uExplode + local) * w; ws += w;
              }
              q = acc / max(ws, 1e-6);
            }
            q = mix(q, normalize(q + 1e-4) * uRadius * (1.0 + 0.18 * snoise(q * 2.2 + uTime * 0.4)), uMelt);
            float nz = snoise(q * 1.25 + vec3(0.0, uTime * 0.17, uTime * 0.11)) + 0.45 * snoise(q * 2.7 - vec3(uTime * 0.12));
            q += n * nz * uAmp;
            vec3 tp = uPointer - q; float dp = length(tp);
            q += tp * uPull * exp(-dp * dp * 2.2);
            if (uImpulse.w > 0.001) {                     // klik: en bølge breder sig gennem materialet
              float d = length(p - uImpulse.xyz), r = uImpulseT * 1.6, x = d - r;
              q += n * sin(x * 13.0) * exp(-x * x * 9.0) * exp(-uImpulseT * 1.3) * uImpulse.w;
              q += n * exp(-d * d * 6.0) * exp(-uImpulseT * 3.0) * -0.12 * uImpulse.w;
            }
            return q;
          }`)
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
          vec3 lq0 = liquidDeform(position, objectNormal);
          vec3 lqT = normalize(cross(objectNormal, abs(objectNormal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
          vec3 lqB = normalize(cross(objectNormal, lqT));
          vec3 lq1 = liquidDeform(position + lqT * 0.012, objectNormal);
          vec3 lq2 = liquidDeform(position + lqB * 0.012, objectNormal);
          vec3 lqN = cross(lq1 - lq0, lq2 - lq0);
          objectNormal = length(lqN) > 1e-9 ? normalize(lqN) : objectNormal;`)
        .replace('#include <begin_vertex>', 'vec3 transformed = lq0;');
    };
    this.mesh = new Mesh(geometry, this.mat);
    this.spin.add(this.mesh);
    this.group.add(this.spin);
    this.scene.add(this.group);
    if (opts.backdrop) this.addBackdrop();

    if (opts.intro) { this.u.uMelt.value = 1; this.group.scale.setScalar(.18); this.introT = 0; }
    this.resize();
    if (opts.interactive) this.bindInteraction();
  }

  /** kompilerer shaderne uden at blokere siden (parallel kompilering, hvor browseren har den) */
  async warm() {
    try { await this.renderer.compileAsync(this.scene, this.camera); } catch { /* tegnes og kompileres så ved første billede */ }
    this.opts.onReady?.();
  }

  // ---------- miljø: et sort studie med bløde lyspaneler; et varmt og et koldt panel giver chrome de orange/blå toner ----------
  private studioEnvironment(): Texture {
    const env = new Scene();
    const room = new Mesh(new BoxGeometry(10, 10, 10), new MeshBasicMaterial({ color: 0x030303, side: BackSide }));
    env.add(room);
    const panel = (w: number, h: number, rgb: [number, number, number], k: number, pos: [number, number, number], look: [number, number, number] = [0, 0, 0]) => {
      const m = new MeshBasicMaterial(); m.color.setRGB(rgb[0] * k, rgb[1] * k, rgb[2] * k);
      const p = new Mesh(new PlaneGeometry(w, h), m); p.position.set(...pos); p.lookAt(...look); env.add(p);
    };
    panel(6, 1.4, [1, 1, 1], 7, [0, 4.6, 0]);                    // stort softbox ovenfra
    panel(.5, 6, [1, .58, .28], 9, [-4.6, .5, 1.2]);            // varm stribe
    panel(.5, 6, [.38, .62, 1], 9, [4.6, .2, 1.4]);             // kold stribe
    panel(4, .25, [1, 1, 1], 10, [0, 1.6, 4.6]);                // skarp highlight forfra
    panel(.18, 4, [1, 1, 1], 6, [2.2, 0, -4.7]);
    panel(.18, 4, [1, 1, 1], 6, [-2.2, 0, -4.7]);
    panel(7, .5, [1, 1, 1], 7, [0, 3.4, -4.6]);                 // modlys: tegner silhuetten op mod det sorte
    panel(.4, 5, [1, .9, .8], 5, [-3.6, -.5, -4.2]);
    panel(8, 3, [.18, .17, .16], 1, [0, -4.8, 0]);              // svagt gulv
    const pm = new PMREMGenerator(this.renderer);
    const rt = pm.fromScene(env, .035);
    pm.dispose();
    env.traverse(o => { const m = o as Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as MeshBasicMaterial).dispose(); } });
    this.disposeFns.push(() => rt.dispose());
    return rt.texture;
  }

  // tekst bag objektet, så glas-tilstanden har noget at bryde
  private addBackdrop() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
    const x = c.getContext('2d')!;
    x.fillStyle = '#17181c'; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 2;
    for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, 1024); x.stroke(); }
    for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(0, i * 128); x.lineTo(2048, i * 128); x.stroke(); }
    x.fillStyle = 'rgba(233,231,224,.16)'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 300px "Geist", "Inter", "Helvetica Neue", Arial, sans-serif';
    x.fillText('LIQUID', 1024, 560);
    x.font = '500 54px "Geist Mono", ui-monospace, monospace'; x.fillStyle = 'rgba(233,231,224,.2)';
    x.fillText('NOTHING STAYS STILL — NOTHING STAYS STILL — NOTHING STAYS STILL', 1024, 800);
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
    const plane = new Mesh(new PlaneGeometry(12, 6), new MeshBasicMaterial({ map: t, toneMapped: false }));
    plane.position.z = -3.2;
    this.scene.add(plane);
    this.disposeFns.push(() => { t.dispose(); plane.geometry.dispose(); (plane.material as MeshBasicMaterial).dispose(); });
  }

  // ---------- materialer ----------
  setMaterial(name: MaterialName) { this.target = { ...P[name] }; }
  /** 0 = våd maling … 1 = chrome (bruges af scroll i hero) */
  setScrollMix(t: number) { this.scrollMix = Math.min(1, Math.max(0, t)); }
  private applyParams() {
    const c = this.cur, m = this.mat;
    m.color.setRGB(c.r, c.g, c.b);
    m.metalness = c.metalness; m.roughness = c.roughness; m.clearcoat = c.clearcoat; m.clearcoatRoughness = c.clearcoatRoughness;
    m.transmission = c.transmission < .01 ? 0 : c.transmission; m.thickness = c.thickness;
    m.iridescence = c.iridescence < .01 ? 0 : c.iridescence; m.sheen = c.sheen < .01 ? 0 : c.sheen;
    m.envMapIntensity = c.env; m.dispersion = c.dispersion < .05 ? 0 : c.dispersion;
    this.u.uAmp.value = c.amp;
  }

  // ---------- input ----------
  /** -1..1 fra midten af lærredet */
  setPointer(x: number, y: number, inside = true) { this.pointer.set(x, y); this.hover = inside ? 1 : 0; }
  impulse(x: number, y: number) {
    this.raycaster.setFromCamera(new Vector2(x, y), this.camera);
    const hit = this.raycaster.intersectObject(this.mesh)[0];
    const p = hit ? this.mesh.worldToLocal(hit.point.clone()) : new Vector3(0, 0, .3);
    this.u.uImpulse.value.set(p.x, p.y, p.z, hit ? .09 : .05);
    this.u.uImpulseT.value = 0;
  }
  setExplode(on: boolean) { this.explodeTarget = on ? 1 : 0; }
  get exploded() { return this.explodeTarget > .5; }

  private bindInteraction() {
    const el = this.canvas;
    let down: { x: number; y: number; t: number } | null = null, last = { x: 0, y: 0 };
    const local = (e: PointerEvent) => { const r = el.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) }; };
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; last = { x: e.clientX, y: e.clientY }; this.dragging = true; el.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      const l = local(e); this.setPointer(l.x, l.y, true);
      if (!this.dragging || !down) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
      this.rotVel.x += dy * .0026; this.rotVel.y += dx * .0026;
    };
    const onUp = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 400) { const l = local(e); this.impulse(l.x, l.y); }
      down = null; this.dragging = false;
    };
    const onLeave = () => { this.hover = 0; };
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp); el.addEventListener('pointerleave', onLeave);
    this.disposeFns.push(() => {
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp); el.removeEventListener('pointerleave', onLeave);
    });
  }

  // ---------- løkke ----------
  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // objektet fylder det samme uanset format: smalle skærme rykker kameraet tilbage
    this.camera.position.z = w / h < 1 ? 6.2 / Math.max(.52, w / h) * .78 : 6.2;
    // brede formater: objektet rykker lidt til højre for teksten
    const a = w / h;
    this.baseX = this.opts.offset && a > 1.2 ? Math.min(1.5, (a - 1) * 1.55) : 0;
    this.baseS = this.opts.offset && a > 1.2 ? .84 : 1;
    this.baseY = this.opts.offset && a < .9 ? -1.15 : 0;          // høje skærme: under teksten, oven på ordet
    this.camera.updateProjectionMatrix();
  }
  setVisible(v: boolean) { this.visible = v; if (v) this.start(); else this.stop(); }
  start() { if (this.running || !this.visible) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  renderOnce() { this.step(0); this.renderer.render(this.scene, this.camera); }

  private tick = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now(); this.step(Math.min(.05, (now - this.last) / 1000)); this.last = now;
    this.renderer.render(this.scene, this.camera);
  };

  private step(dt: number) {
    const t = (this.u.uTime.value += dt);
    // materialet glider mod målet; scroll i hero blander chrome ind
    const tgt = this.target, mixed: Params = { ...tgt };
    if (this.scrollMix > 0) (Object.keys(mixed) as (keyof Params)[]).forEach(k => { mixed[k] = tgt[k] + (P.chrome[k] - tgt[k]) * this.scrollMix; });
    const k = 1 - Math.exp(-dt * 3.2);
    (Object.keys(this.cur) as (keyof Params)[]).forEach(key => { this.cur[key] += (mixed[key] - this.cur[key]) * k; });
    this.applyParams();

    // intro: fra en lille mørk masse til symbolet (fjeder med lidt efterslæb, som noget tyktflydende)
    if (this.introT >= 0) {
      this.introT += dt;
      const e = Math.min(1, this.introT / 1.5);
      const s = .18 + (1 - .18) * (1 - Math.pow(1 - e, 3));
      this.group.scale.setScalar(this.baseS * s * (1 + Math.sin(e * Math.PI) * .04));
      const meltTarget = this.introT < .35 ? 1 : 0;
      this.meltVel += ((meltTarget - this.u.uMelt.value) * 38 - this.meltVel * 9) * dt;
      this.u.uMelt.value = Math.min(1.1, Math.max(-.08, this.u.uMelt.value + this.meltVel * dt));
      if (this.introT > 3) { this.introT = -1; this.u.uMelt.value = 0; }
    }

    // opløsning og samling med fjeder
    this.explodeVel += ((this.explodeTarget - this.u.uExplode.value) * 16 - this.explodeVel * 5.5) * dt;
    this.u.uExplode.value = Math.max(0, this.u.uExplode.value + this.explodeVel * dt);

    // klikbølge
    if (this.u.uImpulse.value.w > 0) { this.u.uImpulseT.value += dt; if (this.u.uImpulseT.value > 4) this.u.uImpulse.value.w = 0; }

    // markøren: blød efterfølgning; objektet læner sig mod den og trækkes en anelse ud
    const ps = 1 - Math.exp(-dt * 3.5);
    this.pointerS.x += (this.pointer.x - this.pointerS.x) * ps; this.pointerS.y += (this.pointer.y - this.pointerS.y) * ps;
    const pull = this.hover * .16;
    this.u.uPull.value += (pull - this.u.uPull.value) * ps;
    const wp = new Vector3(this.pointerS.x * 2.4 * this.camera.aspect, this.pointerS.y * 2.2, .6);
    this.u.uPointer.value.copy(this.mesh.worldToLocal(wp));

    // inerti på drejning
    const damp = Math.exp(-dt * 2.4);
    this.rot.x += this.rotVel.x; this.rot.y += this.rotVel.y; this.rotVel.multiplyScalar(this.dragging ? .5 : damp);
    this.rot.x *= this.dragging ? 1 : Math.exp(-dt * .7);                     // vipper langsomt tilbage
    this.spin.rotation.x = this.rot.x + Math.sin(t * .13) * .1 - this.pointerS.y * .22;
    this.spin.rotation.y = this.rot.y + Math.sin(t * .21) * .34 + this.pointerS.x * .32;
    this.spin.rotation.z = Math.sin(t * .09) * .05;
    this.group.position.y = Math.sin(t * .45) * .045 + (this.opts.offset ? .12 : 0) + this.baseY;
    this.group.position.x = this.baseX;
    if (this.introT < 0) this.group.scale.setScalar(this.baseS);

    // lyset vandrer langsomt rundt
    this.envRot += dt * .05;
    this.scene.environmentRotation.set(Math.sin(this.envRot * .7) * .25, this.envRot, 0);
  }

  dispose() {
    this.stop();
    this.disposeFns.forEach(f => f());
    this.mesh.geometry.dispose(); this.mat.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}
