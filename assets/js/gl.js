/*
  Insolation cyanotype (WebGL, OGL).
  Les images marquées .insole apparaissent comme un tirage au bleu de Prusse
  qui s'expose à la lumière jusqu'à leurs vraies couleurs.
  L'image d'accueil garde ensuite une légère ondulation liquide au survol.
  Sans WebGL ou en mode calme : l'image reste telle quelle.
*/
import { Renderer } from '../vendor/ogl/core/Renderer.js';
import { Program } from '../vendor/ogl/core/Program.js';
import { Mesh } from '../vendor/ogl/core/Mesh.js';
import { Texture } from '../vendor/ogl/core/Texture.js';
import { Triangle } from '../vendor/ogl/extras/Triangle.js';

const H = document.documentElement;
const calme = H.classList.contains('calme');

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform float uProg;
uniform float uTime;
uniform float uHover;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uMouse;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

void main() {
  float s = max(uRes.x / uImg.x, uRes.y / uImg.y);
  vec2 size = uImg * s;
  vec2 off = (size - uRes) * 0.5;
  vec2 uv = (vUv * uRes + off) / size;

  vec2 dm = vUv - uMouse;
  dm.x *= uRes.x / uRes.y;
  float d = length(dm);
  uv += normalize(dm + 1e-5) * sin(d * 46.0 - uTime * 3.2) * 0.007 * exp(-d * 5.5) * uHover;

  vec3 col = texture2D(tMap, uv).rgb;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 cyan = mix(vec3(0.055, 0.15, 0.40), vec3(0.93, 0.95, 0.985), smoothstep(0.06, 0.94, lum));

  float n = fbm(vUv * vec2(3.0, 4.0) + vec2(0.0, uTime * 0.04));
  float v = (1.0 - vUv.y) * 0.62 + n * 0.38;
  float revele = 1.0 - smoothstep(uProg - 0.14, uProg, v);
  float bord = smoothstep(uProg - 0.14, uProg - 0.06, v) * (1.0 - smoothstep(uProg - 0.05, uProg, v));

  vec3 c = mix(cyan, col, revele) + vec3(1.0, 0.82, 0.55) * bord * 0.32;
  gl_FragColor = vec4(c, 1.0);
}
`;

const MAX_ACTIFS = 4;
let actifs = 0;
const attente = [];

function demarrer(fig) {
  if (fig._gl) return;
  const img = fig.querySelector('img');
  if (!img) return;
  if (actifs >= MAX_ACTIFS) { attente.push(fig); return; }
  fig._gl = true;
  actifs++;
  const persiste = fig.hasAttribute('data-onde');
  const lancer = () => {
    let renderer;
    try {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, persiste ? 1.75 : 1.5), alpha: false, antialias: false, powerPreference: persiste ? 'high-performance' : 'low-power' });
    } catch (e) { liberer(); return; }
    const gl = renderer.gl;
    if (!gl) { liberer(); return; }
    const canvas = gl.canvas;
    canvas.className = 'gl';
    canvas.setAttribute('aria-hidden', 'true');
    const texture = new Texture(gl, { generateMipmaps: false });
    texture.image = img;
    const program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        tMap: { value: texture }, uProg: { value: 0 }, uTime: { value: 0 }, uHover: { value: 0 },
        uRes: { value: [1, 1] }, uImg: { value: [img.naturalWidth || 1, img.naturalHeight || 1] }, uMouse: { value: [0.5, 0.5] }
      }
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const u = program.uniforms;
    const taille = () => {
      const r = fig.getBoundingClientRect();
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
      u.uRes.value = [Math.max(1, r.width), Math.max(1, r.height)];
    };
    taille();
    fig.appendChild(canvas);
    const rendre = () => { u.uTime.value = performance.now() / 1000; renderer.render({ scene: mesh }); };
    rendre();
    window.addEventListener('resize', () => { taille(); rendre(); });

    let boucle = 0, cibleHover = 0;
    const tourner = () => {
      u.uHover.value += (cibleHover - u.uHover.value) * 0.06;
      rendre();
      if (Math.abs(cibleHover - u.uHover.value) > 0.002 || cibleHover > 0) boucle = requestAnimationFrame(tourner); else boucle = 0;
    };

    const fin = () => {
      if (persiste) {
        fig.addEventListener('pointermove', (e) => {
          const r = fig.getBoundingClientRect();
          u.uMouse.value = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
          cibleHover = 1;
          if (!boucle) boucle = requestAnimationFrame(tourner);
        });
        fig.addEventListener('pointerleave', () => { cibleHover = 0; if (!boucle) boucle = requestAnimationFrame(tourner); });
        return;
      }
      canvas.remove();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      liberer();
    };

    const duree = persiste ? 2.6 : 2.2;
    if (window.gsap) {
      window.gsap.to(u.uProg, { value: 1.16, duration: duree, ease: 'power2.inOut', delay: persiste ? 0.5 : 0, onUpdate: rendre, onComplete: fin });
    } else {
      const t0 = performance.now();
      const pas = () => { const p = Math.min(1, (performance.now() - t0) / (duree * 1000)); u.uProg.value = p * 1.16; rendre(); if (p < 1) requestAnimationFrame(pas); else fin(); };
      requestAnimationFrame(pas);
    }
  };
  const pret = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(lancer);
  if (img.complete && img.naturalWidth) pret(); else img.addEventListener('load', pret, { once: true });

  function liberer() {
    actifs = Math.max(0, actifs - 1);
    const suivante = attente.shift();
    if (suivante) demarrer(suivante);
  }
}

function init() {
  if (calme) return;
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;
  const figs = Array.from(document.querySelectorAll('.insole'));
  if (!figs.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); demarrer(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  figs.forEach((f) => io.observe(f));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
