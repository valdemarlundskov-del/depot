"""Kopierer studiets egne billeder og showreel fra hovedsitet til liquid/public/media i passende størrelser.
Kør fra liquid/:  python3 scripts/media.py"""
import os, shutil
from PIL import Image

SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'media'))
SETS = ['porsche924', 'vildbjerg', 'thailand', 'landskab']
SIZES = {'lg': 2000, 'sm': 900}

for s in SETS:
    for f in sorted(os.listdir(os.path.join(SRC, 'images', s))):
        if not f.endswith('.webp') or f.startswith('bk-'):
            continue
        im = Image.open(os.path.join(SRC, 'images', s, f)).convert('RGB')
        for tag, mx in SIZES.items():
            out = os.path.join(DST, s, tag, f)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            c = im.copy(); c.thumbnail((mx, mx), Image.LANCZOS)
            c.save(out, 'WEBP', quality=80 if tag == 'lg' else 74, method=6)

os.makedirs(os.path.join(DST, 'team'), exist_ok=True)
for who in ['valdemar', 'basharat']:
    shutil.copy(os.path.join(SRC, 'images', 'om', who + '-1400.webp'), os.path.join(DST, 'team', who + '.webp'))
os.makedirs(os.path.join(DST, 'reel'), exist_ok=True)
for f in ['showreel-sm.mp4', 'showreel-sm.webm', 'showreel-poster.jpg']:
    shutil.copy(os.path.join(SRC, 'video', f), os.path.join(DST, 'reel', f))
shutil.copy(os.path.join(SRC, 'images', 'logo', 'bk-blob.svg'), os.path.join(DST, 'symbol.svg'))
print('ok')

# mål på billederne (bruges til layout og til at undgå layout-skift)
import json
man = {}
for s in SETS:
    d = os.path.join(DST, s, 'lg')
    man[s] = [{'file': f, 'w': Image.open(os.path.join(d, f)).size[0], 'h': Image.open(os.path.join(d, f)).size[1]} for f in sorted(os.listdir(d))]
os.makedirs(os.path.join(DST, '..', '..', 'content'), exist_ok=True)
with open(os.path.join(DST, '..', '..', 'content', 'media.json'), 'w') as fh:
    json.dump(man, fh, indent=1)
