# -*- coding: utf-8 -*-
"""Сборка index.html: вставляем шрифт и портреты прямо в файл (без внешних файлов)."""
import base64, glob, json, os, re, sys

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SRC)

def data_uri(path):
    with open(path, 'rb') as f:
        b = f.read()
    return 'data:image/png;base64,' + base64.b64encode(b).decode('ascii')

tpl = open(os.path.join(SRC, 'template.html'), encoding='utf-8').read()
font = open(os.path.join(SRC, 'font.json'), encoding='utf-8').read()
her = data_uri(os.path.join(ROOT, 'assets', 'her.png'))
him = data_uri(os.path.join(ROOT, 'assets', 'him.png'))

# --- проверка спрайтов: все строки одной длины
for name in ('SPR_GUY', 'SPR_GIRL'):
    m = re.search(name + r'\s*=\s*\[(.*?)\];', tpl, re.S)
    rows = re.findall(r'"([^"]*)"', m.group(1))
    lens = set(len(r) for r in rows)
    print(name, 'rows:', len(rows), 'widths:', lens)
    assert len(lens) == 1, 'Разная длина строк в ' + name
    assert rows[0].count('.') >= 0

# --- подключаемые части (src/parts/*.js) по маркеру //@@INCLUDE:parts/*.js
import glob
def expand(m):
    pat = m.group(1).strip()
    files = sorted(glob.glob(os.path.join(SRC, pat)))
    assert files, 'Нет частей по маске ' + pat
    out = []
    for f in files:
        out.append('/* ===== ЧАСТЬ: ' + os.path.basename(f) + ' ===== */')
        out.append(open(f, encoding='utf-8').read())
    return '\n'.join(out)

tpl = re.sub(r'//@@INCLUDE:([^\n]+)', expand, tpl)
assert '@@INCLUDE' not in tpl

tpl = tpl.replace('/*__FONT__*/{"asc":12,"cell":16}', font)
tpl = tpl.replace('/*__HER__*/', her)
tpl = tpl.replace('/*__HIM__*/', him)
assert '__FONT__' not in tpl and '__HER__' not in tpl and '__HIM__' not in tpl

out = os.path.join(ROOT, 'index.html')
open(out, 'w', encoding='utf-8').write(tpl)
print('OK ->', out, os.path.getsize(out), 'bytes')
