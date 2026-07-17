"""
Replace REF/型号/包装/箱装/特点 footer bars on sachet & oil product images
with icon-based feature banners (same style as candle-display footers).
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "assets" / "products"

SACHET_FEATURES = [
    ("leaf", "NATURAL OIL", "Aceite Natural / Óleo Natural"),
    ("flower", "LONG LASTING", "Aroma Duradero / Duradouro"),
    ("bag", "ANY SPACE", "Ideal para Cualquier Espacio"),
]

OIL_FEATURES = [
    ("leaf", "NATURAL & PURE", "Esencia Natural / Essência Natural"),
    ("home", "WARM AMBIENCE", "Ambiente Cálido / Aconchegante"),
    ("waves", "LONG LASTING", "Aroma Duradero / Duradouro"),
]


def edge_luminance(im: Image.Image, y: int) -> float:
    w = im.width
    samples = []
    for x in list(range(0, 48)) + list(range(w - 48, w)):
        r, g, b = im.getpixel((x, y))[:3]
        samples.append((r + g + b) / 3)
    return sum(samples) / len(samples)


def detect_footer_top(im: Image.Image) -> int:
    """Find top of dark footer bar using left/right edge luminance."""
    w, h = im.size
    # Bottom edge color
    base = edge_luminance(im, h - 2)
    if base > 120:
        # No dark footer
        return h

    top = h
    # Walk up while edges stay near the footer color
    for y in range(h - 1, max(0, h - 160), -1):
        lum = edge_luminance(im, y)
        if abs(lum - base) < 28 and lum < 115:
            top = y
        else:
            # allow a couple of noisy rows
            if y > top - 3:
                continue
            break

    # Expand slightly upward if a thin separator exists
    for y in range(top - 1, max(0, top - 8), -1):
        lum = edge_luminance(im, y)
        if lum < 115:
            top = y
        else:
            break

    # Minimum sensible footer height
    if h - top < 36:
        return max(0, h - 72)
    return top


def footer_color(im: Image.Image, top: int) -> tuple[int, int, int]:
    w, h = im.size
    # Sample bottom corners (avoid text)
    samples = []
    for y in range(max(top + 2, h - 20), h - 1):
        for x in list(range(4, 24)) + list(range(w - 24, w - 4)):
            samples.append(im.getpixel((x, y))[:3])
    if not samples:
        return (70, 50, 30)
    r = sum(c[0] for c in samples) // len(samples)
    g = sum(c[1] for c in samples) // len(samples)
    b = sum(c[2] for c in samples) // len(samples)
    return (r, g, b)


def lighten(rgb: tuple[int, int, int], amount: float = 0.35) -> tuple[int, int, int]:
    return tuple(min(255, int(c + (255 - c) * amount)) for c in rgb)


def darken(rgb: tuple[int, int, int], amount: float = 0.2) -> tuple[int, int, int]:
    return tuple(max(0, int(c * (1 - amount))) for c in rgb)


def get_font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_icon(draw: ImageDraw.ImageDraw, kind: str, cx: int, cy: int, r: int, color):
    """Simple white line icons inside a circle."""
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=max(2, r // 10))
    s = r * 0.55
    wline = max(2, r // 9)

    if kind == "leaf":
        # Leaf oval + stem
        draw.ellipse(
            (cx - s * 0.55, cy - s * 0.85, cx + s * 0.55, cy + s * 0.75),
            outline=color,
            width=wline,
        )
        draw.line((cx, cy - s * 0.7, cx, cy + s * 0.85), fill=color, width=wline)
        draw.line((cx, cy, cx + s * 0.4, cy - s * 0.25), fill=color, width=max(1, wline - 1))
    elif kind == "flower":
        for i in range(5):
            ang = -math.pi / 2 + i * 2 * math.pi / 5
            px = cx + math.cos(ang) * s * 0.55
            py = cy + math.sin(ang) * s * 0.55
            pr = s * 0.32
            draw.ellipse((px - pr, py - pr, px + pr, py + pr), outline=color, width=max(1, wline - 1))
        draw.ellipse((cx - s * 0.22, cy - s * 0.22, cx + s * 0.22, cy + s * 0.22), outline=color, width=wline)
    elif kind == "bag":
        # Shopping bag
        draw.rectangle(
            (cx - s * 0.55, cy - s * 0.15, cx + s * 0.55, cy + s * 0.75),
            outline=color,
            width=wline,
        )
        draw.arc(
            (cx - s * 0.35, cy - s * 0.75, cx + s * 0.35, cy + s * 0.15),
            start=200,
            end=340,
            fill=color,
            width=wline,
        )
    elif kind == "home":
        # House
        draw.polygon(
            [
                (cx, cy - s * 0.75),
                (cx - s * 0.7, cy - s * 0.05),
                (cx + s * 0.7, cy - s * 0.05),
            ],
            outline=color,
        )
        draw.rectangle(
            (cx - s * 0.5, cy - s * 0.05, cx + s * 0.5, cy + s * 0.7),
            outline=color,
            width=wline,
        )
        draw.rectangle(
            (cx - s * 0.15, cy + s * 0.2, cx + s * 0.15, cy + s * 0.7),
            outline=color,
            width=max(1, wline - 1),
        )
    elif kind == "waves":
        for i, dy in enumerate((-0.35, 0.0, 0.35)):
            y0 = cy + s * dy
            draw.arc(
                (cx - s * 0.7, y0 - s * 0.35, cx - s * 0.05, y0 + s * 0.35),
                start=200,
                end=340,
                fill=color,
                width=wline,
            )
            draw.arc(
                (cx - s * 0.05, y0 - s * 0.35, cx + s * 0.7, y0 + s * 0.35),
                start=20,
                end=160,
                fill=color,
                width=wline,
            )
    else:
        draw.ellipse((cx - s * 0.4, cy - s * 0.4, cx + s * 0.4, cy + s * 0.4), outline=color, width=wline)


def paint_feature_footer(
    im: Image.Image,
    top: int,
    features: list[tuple[str, str, str]],
    bg: tuple[int, int, int],
) -> Image.Image:
    w, h = im.size
    fh = h - top
    draw = ImageDraw.Draw(im)

    # Fill footer
    draw.rectangle((0, top, w, h), fill=bg)

    # Thin top highlight line
    draw.line((0, top, w, top), fill=lighten(bg, 0.25), width=1)

    icon_color = (255, 255, 255)
    title_font = get_font(max(13, fh // 4), bold=True)
    sub_font = get_font(max(10, fh // 6), bold=False)

    n = len(features)
    col_w = w / n
    cy = top + fh // 2
    icon_r = max(14, min(24, fh // 3))
    side_pad = max(16, int(col_w * 0.06))

    for i, (kind, title, subtitle) in enumerate(features):
        col_left = int(i * col_w) + side_pad
        col_right = int((i + 1) * col_w) - side_pad
        icon_cx = col_left + icon_r
        text_x = icon_cx + icon_r + max(8, fh // 7)
        max_text_w = max(40, col_right - text_x)

        draw_icon(draw, kind, icon_cx, cy, icon_r, icon_color)

        # Shrink fonts if needed so text fits the column
        t_font = title_font
        s_font = sub_font
        for size in range(title_font.size, 9, -1):
            t_font = get_font(size, bold=True)
            if draw.textbbox((0, 0), title, font=t_font)[2] <= max_text_w:
                break
        for size in range(sub_font.size, 8, -1):
            s_font = get_font(size, bold=False)
            if draw.textbbox((0, 0), subtitle, font=s_font)[2] <= max_text_w:
                break

        title_bbox = draw.textbbox((0, 0), title, font=t_font)
        sub_bbox = draw.textbbox((0, 0), subtitle, font=s_font)
        title_h = title_bbox[3] - title_bbox[1]
        sub_h = sub_bbox[3] - sub_bbox[1]
        gap = max(2, fh // 20)
        block_h = title_h + gap + sub_h
        ty = cy - block_h // 2

        draw.text((text_x, ty), title, font=t_font, fill=(255, 255, 255))
        draw.text(
            (text_x, ty + title_h + gap),
            subtitle,
            font=s_font,
            fill=lighten(bg, 0.55),
        )

        # Divider between columns
        if i < n - 1:
            dx = int((i + 1) * col_w)
            pad = max(8, fh // 5)
            draw.line((dx, top + pad, dx, h - pad), fill=lighten(bg, 0.18), width=1)

    return im


def process(path: Path, features: list[tuple[str, str, str]]) -> bool:
    im = Image.open(path).convert("RGB")
    top = detect_footer_top(im)
    if top >= im.height - 20:
        print(f"SKIP (no footer): {path.name}")
        return False
    bg = footer_color(im, top)
    # Slightly darken for cleaner look
    bg = darken(bg, 0.05)
    paint_feature_footer(im, top, features, bg)
    im.save(path, optimize=True)
    print(f"OK {path.name}: footer {top}-{im.height} ({im.height - top}px) color={bg}")
    return True


def main():
    sachets = sorted(PRODUCTS.glob("*-sachet.png"))
    oils = sorted(PRODUCTS.glob("*-oil.png"))
    print(f"Sachets: {len(sachets)}, Oils: {len(oils)}")
    n = 0
    for p in sachets:
        if process(p, SACHET_FEATURES):
            n += 1
    for p in oils:
        if process(p, OIL_FEATURES):
            n += 1
    print(f"Updated {n} images")


if __name__ == "__main__":
    main()
