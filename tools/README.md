# BK Studio — sådan bygges siden

Siden er statisk HTML, der hostes på Vercel. Alle sider genereres fra `src/data.json` og skabelonerne i `tools/build.py`.

## Filer

| Fil | Indhold |
| --- | --- |
| `assets/bk.css` | Hele designsystemet (farver, typografi, layout, alle sektioner). |
| `src/bk.js` → `assets/bk.js` | Al adfærd: blød scroll (Lenis), header, mobilmenu, cursor, scroll-animationer, galleri, ydelser, proces, sideskift, åbningstider, filtre, lysboks og formularer. |
| `src/logo3d.js` → `assets/logo3d.js` | Det svævende 3D-logo (three.js). Hentes først, når det nærmer sig skærmen. |
| `src/data.json` | Projekter, arkivets billeder og pixelmålene for hver billedstørrelse (til `srcset`). |
| `tools/build.py` | Bygger alle HTML-sider, `sitemap.xml` og de engelske oversættelser i `i18n.js`. |
| `tools/privatlivspolitik.html` | Teksten i privatlivspolitikken. |
| `i18n.js` | Dansk → engelsk. Poster mellem `/* build.py: start */` og `/* build.py: slut */` skrives af `build.py`. |

## Byg HTML

```sh
python3 tools/build.py
```

## Byg JavaScript

Kræver Node og pakkerne `esbuild`, `lenis` og `three@0.186.1` (installeres et andet sted end i projektet):

```sh
npx esbuild src/bk.js --bundle --minify --format=iife --target=es2019 --outfile=assets/bk.js
npx esbuild src/logo3d.js --bundle --minify --format=esm --outfile=assets/logo3d.js
```

## Nyt projekt

1. Læg billederne i `images/<id>/` (fuld størrelse, 2048 px på den lange led), `images/thumbs/<id>/` (1100 px) og `images/tiny/<id>__<fil>` (480 px).
2. Tilføj billederne under `media` i `src/data.json` med deres mål, og tilføj projektet under `projects`. Felterne `video` (sti til en videofil) og `bts` (liste med billeder bag kameraet) er valgfrie. Når de findes, vises de på projektsiden.
3. Kør `python3 tools/build.py`. Projektet får automatisk sin egen side på `/arbejde/<id>` og dukker op på forsiden, på /arbejde og i arkivet.

## Skrifttyper

Inter og Inter Tight er self-hostede i `fonts/` under SIL Open Font License (`fonts/OFL.txt`).
