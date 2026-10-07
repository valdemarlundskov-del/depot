// Bygger en selvstændig preview til deling (fx som privat side): node preview/build.mjs <ud-mappe>
// Én HTML-fil med al CSS og JS indlejret + mediefilerne ved siden af (relative stier).
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || path.join(root, 'preview-out'));
fs.mkdirSync(out, { recursive: true });

const r = await build({
  entryPoints: [path.join(root, 'preview/main.tsx')], bundle: true, write: false, minify: true, format: 'iife',
  target: 'es2020', jsx: 'automatic', tsconfig: path.join(root, 'tsconfig.json'),
  alias: { 'next/navigation': path.join(root, 'preview/router.ts') },
  define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none',
});
let js = r.outputFiles[0].text.replace(/(["'`])\/media\//g, '$1media/').replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8').replace(/<\/style/gi, '');
const boot = `(function(){var d=document.documentElement;d.classList.add('js');d.dataset.tone='dark';try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r){var s=sessionStorage.getItem('lq-intro');d.classList.add(s?'intro-short':'intro');sessionStorage.setItem('lq-intro','1');setTimeout(function(){d.classList.add('intro-done')},4000)}}catch(e){d.classList.add('intro')}})();`;
const html = `<title>LIQUID Studio</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&display=swap">
<style>:root{--font-sans:'Geist';--font-mono:'Geist Mono';padding:0!important}</style>
<style>${css}</style>
<script>${boot}</script>
<a class="skip" href="#main">Skip to content</a>
<div id="app"></div>
<script>${js}</script>
`;
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.cpSync(path.join(root, 'public/media'), path.join(out, 'media'), { recursive: true });
console.log('preview →', out, (html.length / 1024).toFixed(0) + ' KB');
