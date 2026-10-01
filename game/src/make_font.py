from PIL import Image, ImageDraw, ImageFont
import json

FP = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SIZE = 12
ASC = 12
CELL = 16
TH = 120

CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
CHARS += "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюяЁё№«»…—"

f = ImageFont.truetype(FP, SIZE)
out = {}

for ch in CHARS:
    im = Image.new('L', (80, CELL), 0)
    d = ImageDraw.Draw(im)
    d.text((10, ASC), ch, anchor='ls', fill=255, font=f)
    bb = im.getbbox()
    if not bb:
        out[ch] = (3, 0, 0, '')
        continue
    x0, y0, x1, y1 = bb
    crop = im.crop((x0, 0, x1, CELL))
    w, hh = crop.size
    px = crop.load()
    rows = []
    for y in range(hh):
        v = 0
        for x in range(w):
            if px[x, y] > TH:
                v |= (1 << x)
        rows.append(v)
    out[ch] = (w, hh, 0, ','.join('%x' % r for r in rows))  # y0=0: строки уже включают пустые сверху

# сердечко рисуем руками (в TTF его нет в нужном виде)
heart_rows = ['0'] * 6 + ['66', 'ff', 'ff', '7e', '3c', '18'] + ['0'] * 4
out['\u2665'] = (8, CELL, 0, ','.join(heart_rows))

data = {'asc': ASC, 'cell': CELL, 'g': out}
open('/home/user/game/src/font.json', 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False))
print('glyphs:', len(out))
for ch in "ЯЖШЩЁЭab0":
    w, h, y0, s = out[ch]
    print(ch, w, h, y0, s)
