from PIL import Image

def scan(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    print(f"\n=== {path} {w}x{h} ===")
    for y in range(h - 1, h - 120, -1):
        pixels = [im.getpixel((x, y)) for x in range(0, w, 8)]
        r = sum(p[0] for p in pixels) / len(pixels)
        g = sum(p[1] for p in pixels) / len(pixels)
        b = sum(p[2] for p in pixels) / len(pixels)
        lum = (r + g + b) / 3
        # variance proxy
        var = sum((p[0] - r) ** 2 for p in pixels) / len(pixels)
        marker = " <<<" if lum < 110 and var < 800 else ""
        if y % 2 == 0 or marker:
            print(f"y={y:4d} RGB=({r:5.1f},{g:5.1f},{b:5.1f}) lum={lum:5.1f} var={var:7.1f}{marker}")

scan("assets/products/apple-sachet.png")
scan("assets/products/lavender-oil.png")
