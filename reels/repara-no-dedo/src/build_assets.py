"""Monta as faixas de rolagem (strips) de cada perfil a partir dos prints do Instagram.

- Remove a linha "Seguido(a) por" (mostra perfis de terceiros) dos cabecalhos.
- Junta cabecalho + linhas da grade (novas em cima, antigas embaixo), com o separador original de 3 px.
- Exporta: strip PNG, cabecalho fixo (sticky), barra de status, recortes de tiles e avatares, e layout.json.

Uso: python3 -I src/build_assets.py <pasta_dos_prints> <pasta_assets>
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

SHOT = {  # ordem em que os prints foram enviados
    1: "f0f77913", 2: "5dd28091", 3: "df49b549",       # Intensa: perfil, grade nova, grade antiga
    4: "c395ee30", 5: "4d651c71", 6: "66677324",       # Hospital
    7: "6e34e7a6", 8: "13d0fb6a",                      # W&S
    9: "06e70f2a", 10: "e378f72d",                     # Arteiro
}

W = 1290
SEP = 3
COLS = [(0, 428), (431, 859), (862, 1290)]
END_PAD = 140


def img(n):
    return Image.open(SRC / f"{SHOT[n]}-image.png").convert("RGB")


CLIENTS = {
    "intensa": dict(
        profile=1, row1_top=2025, cut=(1281, 1445), sticky=3,
        rows=[(1, 2025, 571), (2, 1042, 571), (2, 1616, 571), (2, 2190, 571),
              (3, 453, 523), (3, 979, 571), (3, 1553, 571), (3, 2127, 571)],
        old_from=4, target=(0, 1), ui={},
    ),
    "hospital": dict(
        profile=4, row1_top=1941, cut=(1197, 1361), sticky=6,
        rows=[(4, 1941, 571), (5, 472, 571), (5, 1046, 571), (5, 1620, 571), (5, 2194, 571),
              (6, 453, 550), (6, 1005, 571), (6, 1578, 571), (6, 2151, 571)],
        old_from=5, target=(1, 0),
        ui={"link": [49, 960, 800, 1030]},          # beacons.ai/hospitaldeolhostn (antes do corte)
    ),
    "ws": dict(
        profile=7, row1_top=1521, cut=(1089, 1253), sticky=8,
        rows=[(7, 1521, 571), (7, 2095, 571),
              (8, 495, 571), (8, 1069, 571), (8, 1643, 571), (8, 2217, 571)],
        old_from=2, target=(1, 0),
        ui={"msg": [415, 1254, 765, 1349]},         # botao "Mensagem" (antes do corte)
    ),
    "arteiro": dict(
        profile=9, row1_top=1773, cut=(1029, 1193), sticky=10,
        rows=[(9, 1773, 571), (10, 500, 571), (10, 1074, 571), (10, 1648, 571), (10, 2222, 571)],
        old_from=None, target=(0, 0), drone=(0, 2), ui={},
    ),
}

layout = {"W": W, "H": 2796, "cols": COLS, "clients": {}}

for name, c in CLIENTS.items():
    prof = img(c["profile"])
    bg = prof.getpixel((645, 5))
    sep_color = prof.getpixel((645, c["row1_top"] - 2))
    a, b = c["cut"]
    cut_h = b - a + 1
    head = Image.new("RGB", (W, c["row1_top"] - cut_h), bg)
    head.paste(prof.crop((0, 0, W, a)), (0, 0))
    head.paste(prof.crop((0, b + 1, W, c["row1_top"])), (0, a))
    header_h = head.height

    cache = {}
    rows = []
    for (n, top, h) in c["rows"]:
        if n not in cache:
            cache[n] = img(n)
        rows.append(cache[n].crop((0, top, W, top + h)))

    total = header_h + sum(r.height + SEP for r in rows) + END_PAD
    strip = Image.new("RGB", (W, total), bg)
    strip.paste(head, (0, 0))
    y = header_h
    row_tops = []
    d = ImageDraw.Draw(strip)
    for r in rows:
        row_tops.append(y)
        strip.paste(r, (0, y))
        y += r.height
        d.rectangle([0, y, W - 1, y + SEP - 1], fill=sep_color)
        y += SEP
    strip_end = y  # fim do conteudo (antes do respiro final)
    strip.save(OUT / f"{name}_strip.png", optimize=True)

    # cabecalho fixo (aparece quando a grade sobe) e barra de status
    sticky_src = img(c["sticky"])
    sticky_h = 453
    sticky_src.crop((0, 0, W, sticky_h)).save(OUT / f"{name}_sticky.png")
    prof.crop((0, 0, W, 150)).save(OUT / f"{name}_status.png")

    def tile_rect(ri, ci):
        x0, x1 = COLS[ci]
        return [x0, row_tops[ri], x1 - x0, rows[ri].height]

    tr = tile_rect(*c["target"])
    strip.crop((tr[0], tr[1], tr[0] + tr[2], tr[1] + tr[3])).save(OUT / f"{name}_tile.png")
    extra = {}
    if "drone" in c:
        dr = tile_rect(*c["drone"])
        strip.crop((dr[0], dr[1], dr[0] + dr[2], dr[1] + dr[3])).save(OUT / f"{name}_drone.png")
        extra["drone"] = dr

    # avatar (circulo do perfil)
    av = prof.crop((49, 358, 305, 614)).resize((256, 256), Image.LANCZOS)
    mask = Image.new("L", (256, 256), 0)
    ImageDraw.Draw(mask).ellipse([4, 4, 251, 251], fill=255)
    av_rgba = av.convert("RGBA")
    av_rgba.putalpha(mask)
    av_rgba.save(OUT / f"{name}_avatar.png")

    ui = {}
    for k, (x0, y0, x1, y1) in c["ui"].items():
        if y0 > b:  # elemento abaixo do corte sobe junto
            y0 -= cut_h
            y1 -= cut_h
        ui[k] = [x0, y0, x1 - x0, y1 - y0]

    layout["clients"][name] = {
        "stripH": total, "stripEnd": strip_end, "headerH": header_h, "stickyH": sticky_h,
        "rowTops": row_tops, "rowHs": [r.height for r in rows],
        "oldStart": row_tops[c["old_from"]] if c["old_from"] is not None else None,
        "target": tr, "ui": ui, "bg": "#%02x%02x%02x" % bg, **extra,
    }
    print(name, "header", header_h, "strip", total, "oldStart", layout["clients"][name]["oldStart"], "target", tr)

(OUT / "layout.json").write_text(json.dumps(layout, indent=1))

# folha de conferencia: as 4 faixas lado a lado, reduzidas
thumbs = [Image.open(OUT / f"{n}_strip.png") for n in CLIENTS]
sc = 0.18
sheet_h = int(max(t.height for t in thumbs) * sc)
sheet = Image.new("RGB", (int(W * sc) * 4 + 30, sheet_h), (60, 60, 60))
for i, t in enumerate(thumbs):
    sheet.paste(t.resize((int(W * sc), int(t.height * sc))), (i * (int(W * sc) + 10), 0))
sheet.save(OUT.parent / "out" / "check_strips.png")

(OUT / "layout.js").write_text("window.LAYOUT=" + json.dumps(layout) + ";\n")
