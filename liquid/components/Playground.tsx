'use client';
// LIQUID-legepladsen: symbolet som et stof, man kan røre ved. Træk for at dreje (med inerti), klik for at sætte en bølge
// i gang, vælg et materiale, eller lad det gå i opløsning og find tilbage til formen. Scroller man gennem afsnittet uden
// at vælge selv, går materialet fra mat blæk over våd maling til chrome.
import { useEffect, useRef, useState } from 'react';
import { MATERIALS, type MaterialName } from '@/lib/gl/materials';
import { SYMBOL_PATH, SYMBOL_VIEWBOX } from '@/lib/symbol';
import { useBlobScene } from './useBlobScene';

const LABEL: Record<MaterialName, string> = { ink: 'Ink', wet: 'Wet paint', chrome: 'Chrome', glass: 'Glass', gel: 'Gel' };

export function Playground() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { scene, fallback, ready } = useBlobScene(canvas, section, { interactive: true, backdrop: true, material: 'ink' });
  const [mat, setMat] = useState<MaterialName>('ink');
  const [split, setSplit] = useState(false);
  const chosen = useRef(false);

  // scroll: blæk → våd maling → chrome, indtil man selv vælger
  useEffect(() => {
    const el = section.current; if (!el) return;
    const on = () => {
      if (chosen.current) return;
      const r = el.getBoundingClientRect();
      const p = (innerHeight - r.top) / (innerHeight + r.height);
      const next: MaterialName = p < .42 ? 'ink' : p < .58 ? 'wet' : 'chrome';
      setMat(m => (m === next ? m : next));
    };
    on(); addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  useEffect(() => { scene.current?.setMaterial(mat); }, [mat, scene, ready]);
  useEffect(() => { scene.current?.setExplode(split); }, [split, scene, ready]);

  const pick = (m: MaterialName) => { chosen.current = true; setMat(m); };
  const onKey = (e: React.KeyboardEvent) => {
    const i = MATERIALS.indexOf(mat);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); pick(MATERIALS[(i + 1) % MATERIALS.length]); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); pick(MATERIALS[(i - 1 + MATERIALS.length) % MATERIALS.length]); }
  };
  useEffect(() => {
    const g = section.current?.querySelector<HTMLButtonElement>(`[data-m="${mat}"]`);
    if (g && chosen.current && section.current?.contains(document.activeElement) && document.activeElement?.getAttribute('role') === 'radio') g.focus();
  }, [mat]);

  return (
    <section ref={section} className="play" id="playground" data-theme="dark" aria-labelledby="play-title">
      <canvas ref={canvas} className={`play-canvas${ready ? ' is-ready' : ''}`} data-cursor="Drag" aria-label="Interactive 3D LIQUID symbol. Drag to rotate, click to disturb the surface." role="img" />
      {fallback && (
        <div className="play-fallback" aria-hidden="true">
          <svg viewBox={SYMBOL_VIEWBOX}><path d={SYMBOL_PATH} fillRule="evenodd" /></svg>
        </div>
      )}
      <div className="play-ui wrap">
        <div className="play-top">
          <p className="meta label"><b>(04)</b>Liquid playground</p>
          <h2 id="play-title" className="h1 play-title">
            <span data-reveal="mask"><span>One idea.</span></span>
            <span data-reveal="mask" style={{ ['--rd' as string]: '.08s' }}><span>Infinite forms.</span></span>
          </h2>
        </div>
        <div className="play-bottom">
          <p className="play-hint">
            {fallback ? 'The interactive object needs WebGL, which is not available in this browser.' : 'Drag to rotate. Click to disturb the surface. Change its material — or let it fall apart and find its way back.'}
          </p>
          {!fallback && (
            <div className="play-controls">
              <div className="seg" role="radiogroup" aria-label="Material" onKeyDown={onKey}>
                {MATERIALS.map(m => (
                  <button key={m} type="button" role="radio" data-m={m} aria-checked={mat === m} tabIndex={mat === m ? 0 : -1} onClick={() => pick(m)}>
                    {LABEL[m]}
                  </button>
                ))}
              </div>
              <div className="play-actions">
                <button type="button" className="btn btn-line" onClick={() => scene.current?.impulse(0, 0)}>Disturb</button>
                <button type="button" className="btn btn-solid" aria-pressed={split} onClick={() => setSplit(s => !s)}>{split ? 'Reassemble' : 'Disperse'}</button>
              </div>
            </div>
          )}
          <p className="meta play-state" aria-live="polite">State — {LABEL[mat]} / {String(MATERIALS.indexOf(mat) + 1).padStart(2, '0')}·05{split ? ' · dispersed' : ''}</p>
        </div>
      </div>
    </section>
  );
}
