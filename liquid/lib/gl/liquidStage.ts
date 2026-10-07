// Ét fælles WebGL-lærred for alle projektbilleder. Hvert billede er et plan, der følger sin plads i DOM'en.
// Ved hover breder en flydende dråbe sig ud fra markøren og afslører et andet billede fra projektet: dråben har en kant
// med lys, en mørk menisk og farvespredning (rød og blå brydes forskelligt), og den strækkes i markørens retning.
// Når billedet kommer ind på skærmen, stiger det op som væske nedefra. Under scroll giver farten en svag bølge.
import {
  LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace,
  Texture, TextureLoader, Vector2, WebGLRenderer,
} from 'three';
import { SNOISE } from './noise';

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex, uTex2;
uniform vec2 uRes, uImg, uImg2, uMouse, uVel;
uniform float uHover, uTime, uReveal, uScroll, uHas2, uZoom;
${SNOISE}
vec2 cover(vec2 uv, vec2 res, vec2 img){
  float rs = res.x / res.y, ri = img.x / img.y;
  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
// > 0 inde i dråben (i pixels)
float field(vec2 uv){
  vec2 p = uv * uRes, m = uMouse * uRes, d = p - m;
  float sp = length(uVel);
  if (sp > 0.001) {                                  // strækkes langs bevægelsen
    vec2 dir = uVel / sp; float a = dot(d, dir); vec2 o = d - dir * a;
    a /= 1.0 + min(sp * 0.035, 0.9) * step(a, 0.0) * 1.6 + min(sp * 0.02, 0.5);
    d = dir * a + o;
  }
  float r = uHover * 0.36 * max(uRes.x, uRes.y);
  float n = snoise(vec3(uv * 2.6 * uRes / max(uRes.x, uRes.y), uTime * 0.35)) * 0.6 + snoise(vec3(uv * 6.0, uTime * 0.6)) * 0.25;
  return r - length(d) + n * r * 0.32;
}
void main(){
  vec2 uv = vUv;
  // scroll: svag bølge
  uv.x += sin(uv.y * 7.0 + uTime * 1.4) * uScroll * 0.012;
  uv.y += sin(uv.x * 5.0 + uTime) * uScroll * 0.006;

  float f = field(uv);
  float e = 1.5 / max(uRes.x, uRes.y);
  vec2 grad = vec2(field(uv + vec2(e, 0.0)) - field(uv - vec2(e, 0.0)), field(uv + vec2(0.0, e)) - field(uv - vec2(0.0, e)));
  float mask = smoothstep(-1.0, 1.0, f);
  float h = smoothstep(0.0, 70.0, f);                 // dråbens højde: rund kant, flad top
  float rim = (1.0 - h) * mask;                        // tæt på kanten
  vec2 nrm = normalize(grad + 1e-5) * rim;

  vec2 par = (uMouse - 0.5) * 0.018 * uHover;          // billedet følger markøren en smule
  vec2 base = cover((uv - 0.5) / uZoom + 0.5 - par, uRes, uImg);
  vec3 c1 = texture2D(uTex, base).rgb;

  vec3 c2 = c1;
  vec2 ref = nrm * 0.045;                              // brydning i kanten
  if (uHas2 > 0.5) {
    vec2 b2 = cover((uv - 0.5) / (uZoom + 0.04) + 0.5 - par * 1.6, uRes, uImg2);
    c2 = vec3(texture2D(uTex2, b2 - ref * 1.25).r, texture2D(uTex2, b2 - ref).g, texture2D(uTex2, b2 - ref * 0.72).b);
  } else {
    c2 = vec3(texture2D(uTex, base - ref * 1.25).r, texture2D(uTex, base - ref).g, texture2D(uTex, base - ref * 0.72).b);
  }
  vec3 col = mix(c1, c2, mask);

  // lys: et skarpt highlight oppe til venstre og en mørk menisk langs kanten
  vec3 N = normalize(vec3(-nrm * 2.2, 1.0));
  vec3 L = normalize(vec3(-0.5, 0.6, 0.65));
  float spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 38.0);
  col += spec * rim * 0.85;
  col *= 1.0 - smoothstep(0.0, 1.0, rim) * 0.32 * (1.0 - h);
  float edge = exp(-f * f / 6.0) * uHover;
  col += vec3(0.9, 0.6, 0.35) * edge * 0.08 * max(0.0, nrm.x) + vec3(0.35, 0.6, 1.0) * edge * 0.08 * max(0.0, -nrm.x);

  // væsken stiger op nedefra, når billedet kommer til syne
  float n2 = snoise(vec3(uv.x * 3.0, uTime * 0.3, 1.0)) * 0.05 + snoise(vec3(uv.x * 9.0, uTime * 0.5, 2.0)) * 0.015;
  float level = uReveal * 1.25 - 0.12 + n2;
  float a = smoothstep(level, level - 0.004, 1.0 - uv.y);
  float line = exp(-pow((1.0 - uv.y - level) * 120.0, 2.0)) * (1.0 - uReveal) * 1.4;
  col += line * 0.5;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

type Item = {
  el: HTMLElement; mesh: Mesh; mat: ShaderMaterial;
  hover: number; hoverT: number; mouse: Vector2; mouseT: Vector2; vel: Vector2;
  reveal: number; revealT: number; loaded: boolean; seen: boolean; off: () => void;
  load: () => void; requested: boolean;
};

export class LiquidStage {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(0, 1, 0, -1, -10, 10);
  private geo = new PlaneGeometry(1, 1);
  private items = new Map<HTMLElement, Item>();
  private loader = new TextureLoader();
  private cache = new Map<string, Promise<Texture>>();
  private last = 0;
  private elapsed = 0;
  private raf = 0;
  private lastY = 0;
  private drawn = false;
  private scrollV = 0;
  private W = 0; private H = 0;
  readonly canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'liquid-stage';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    this.renderer = new WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: false, premultipliedAlpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setClearColor(0, 0);
    this.resize();
    addEventListener('resize', this.resize);
    this.lastY = scrollY;
    this.raf = requestAnimationFrame(this.tick);
  }

  private resize = () => {
    this.W = innerWidth; this.H = innerHeight;
    this.renderer.setSize(this.W, this.H, false);
    this.camera.left = 0; this.camera.right = this.W; this.camera.top = 0; this.camera.bottom = -this.H;
    this.camera.updateProjectionMatrix();
  };

  private tex(src: string) {
    let p = this.cache.get(src);
    if (!p) {
      p = this.loader.loadAsync(src).then(t => { t.colorSpace = SRGBColorSpace; t.minFilter = LinearFilter; t.generateMipmaps = false; return t; });
      this.cache.set(src, p);
    }
    return p;
  }

  add(el: HTMLElement, src: string, src2?: string, opts: { zoom?: number } = {}) {
    if (this.items.has(el)) return;
    const mat = new ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true,
      uniforms: {
        uTex: { value: null }, uTex2: { value: null }, uRes: { value: new Vector2(1, 1) }, uImg: { value: new Vector2(1, 1) },
        uImg2: { value: new Vector2(1, 1) }, uMouse: { value: new Vector2(.5, .5) }, uVel: { value: new Vector2() },
        uHover: { value: 0 }, uTime: { value: 0 }, uReveal: { value: 0 }, uScroll: { value: 0 }, uHas2: { value: 0 }, uZoom: { value: opts.zoom ?? 1 },
      },
    });
    const mesh = new Mesh(this.geo, mat); mesh.visible = false;
    this.scene.add(mesh);
    const it: Item = { el, mesh, mat, hover: 0, hoverT: 0, mouse: new Vector2(.5, .5), mouseT: new Vector2(.5, .5), vel: new Vector2(), reveal: 0, revealT: 0, loaded: false, seen: false, off: () => {}, load: () => {}, requested: false };
    const enter = (e: PointerEvent) => { it.hoverT = 1; this.setMouse(it, e, true); };
    const move = (e: PointerEvent) => this.setMouse(it, e, false);
    const leave = () => { it.hoverT = 0; };
    el.addEventListener('pointerenter', enter); el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    it.off = () => { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
    this.items.set(el, it);
    it.load = () => Promise.all([this.tex(src), src2 ? this.tex(src2) : Promise.resolve(null)]).then(([t1, t2]) => {
      if (!this.items.has(el)) return;
      const im = t1.image as HTMLImageElement;
      mat.uniforms.uTex.value = t1; mat.uniforms.uImg.value.set(im.naturalWidth || im.width, im.naturalHeight || im.height);
      if (t2) { const i2 = t2.image as HTMLImageElement; mat.uniforms.uTex2.value = t2; mat.uniforms.uImg2.value.set(i2.naturalWidth || i2.width, i2.naturalHeight || i2.height); mat.uniforms.uHas2.value = 1; }
      it.loaded = true;
      el.classList.add('is-gl');                      // DOM-billedet skjules først, når WebGL-udgaven er klar
    }).catch(() => { /* billedet bliver bare stående som almindeligt <img> */ });
  }

  remove(el: HTMLElement) {
    const it = this.items.get(el); if (!it) return;
    it.off(); this.scene.remove(it.mesh); it.mat.dispose(); el.classList.remove('is-gl');
    this.items.delete(el);
  }

  private setMouse(it: Item, e: PointerEvent, jump: boolean) {
    const r = it.el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    if (!jump) it.vel.set((x - it.mouseT.x) * r.width, (y - it.mouseT.y) * r.height);
    it.mouseT.set(x, y);
    if (jump) it.mouse.set(x, y);
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now(), dt = Math.min(.05, this.last ? (now - this.last) / 1000 : 0); this.last = now; const t = (this.elapsed += dt);
    const y = scrollY; this.scrollV += ((Math.min(60, Math.abs(y - this.lastY)) / 60) - this.scrollV) * .12; this.lastY = y;
    let any = false;
    const ka = 1 - Math.exp(-dt * 5), kh = 1 - Math.exp(-dt * 4.2), km = 1 - Math.exp(-dt * 9);
    for (const it of this.items.values()) {
      const r = it.el.getBoundingClientRect();
      if (!it.requested && r.top < this.H * 2 && r.bottom > -this.H) { it.requested = true; it.load(); }   // hent først, når billedet nærmer sig
      const vis = it.loaded && r.bottom > -40 && r.top < this.H + 40 && r.width > 0;
      it.mesh.visible = vis;
      if (!vis) continue;
      any = true;
      if (!it.seen && r.top < this.H * .92) { it.seen = true; it.revealT = 1; }
      it.reveal += (it.revealT - it.reveal) * (1 - Math.exp(-dt * 1.6));
      it.hover += (it.hoverT - it.hover) * kh;
      it.mouse.lerp(it.mouseT, km);
      it.vel.multiplyScalar(Math.exp(-dt * 6));
      it.mesh.position.set(r.left + r.width / 2, -(r.top + r.height / 2), 0);
      it.mesh.scale.set(r.width, r.height, 1);
      const u = it.mat.uniforms;
      u.uRes.value.set(r.width, r.height); u.uMouse.value.copy(it.mouse); u.uVel.value.lerp(it.vel, ka);
      u.uHover.value = it.hover; u.uTime.value = t; u.uReveal.value = it.reveal; u.uScroll.value = this.scrollV;
      u.uZoom.value = 1 + it.hover * .03;
    }
    if (any) { this.renderer.render(this.scene, this.camera); this.drawn = true; }
    else if (this.drawn) { this.renderer.clear(); this.drawn = false; }      // intet at tegne: ryd én gang og hvil
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    this.items.forEach((_, el) => this.remove(el));
    this.cache.forEach(p => p.then(t => t.dispose()).catch(() => {}));
    this.geo.dispose(); this.renderer.dispose(); this.canvas.remove();
  }
}

// én fælles instans for hele sitet (kun på enheder med mus; på touch står billederne som almindelige billeder)
let stage: LiquidStage | null = null, failed = false;
export function getLiquidStage() {
  if (stage || failed || typeof window === 'undefined') return stage;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) { failed = true; return null; }
  try { stage = new LiquidStage(); } catch { failed = true; }
  return stage;
}
