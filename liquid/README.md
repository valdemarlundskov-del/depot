# LIQUID — konceptsite (test)

Et eksperimentelt site for BK Studio under konceptnavnet **LIQUID** — *Nothing stays still.*
Ligger for sig selv i `liquid/` og rører ikke hovedsitet (bkstudio.dk). Siden er sat til `noindex`.

## Kør det

```bash
cd liquid
npm install
npm run dev        # http://localhost:3000
npm run build      # produktions-build
```

Se den på Vercel: opret et nyt projekt fra samme repo med **Root Directory = `liquid`** (framework: Next.js).

## Hvad er hvad

| Del | Fil |
| --- | --- |
| Tekster, ydelser, team, kontaktvalg | `content/site.ts` |
| Projekter (billeder, tekst, layout pr. projekt) | `content/projects.ts` |
| 3D-symbolet (blæk / våd maling / chrome / glas / gel) | `lib/gl/blobScene.ts`, `lib/gl/symbolGeometry.ts` |
| Flydende hover + opstigning på alle projektbilleder (ét fælles WebGL-lærred) | `lib/gl/liquidStage.ts` |
| Sideovergange (flydende masse) | `components/Transition.tsx` |
| Kontaktformular → mail | `components/ContactForm.tsx`, `app/api/contact/route.ts` |

Billederne i `public/media` er lavet fra hovedsitets egne billeder med `npm run media` (kræver Python + Pillow).

## Kontaktformularen

Sender via SMTP med samme opsætning som hovedsitet. Sæt `SMTP_USER` og `SMTP_PASS` (se `.env.example`) i Vercel.
Uden dem svarer formularen ærligt, at intet blev sendt, og henviser til e-mailen.

## Tilgængelighed og ydeevne

- Respekterer *reduced motion*: ingen intro, ingen scroll-effekter, WebGL-billeder slås fra.
- Alt indhold er rigtigt HTML; 3D og shaders er ekstra lag. Uden WebGL vises symbolet som SVG.
- three.js hentes først, når der skal bruges 3D; 3D-scener tegner kun, mens de er synlige.
- På touch-enheder bruges almindelige billeder i stedet for WebGL-hover.
