# Generates PWA icons matching the in-app favicon (gold calendar on dark navy).
from PIL import Image, ImageDraw

def make(size, path):
    s = size / 32.0  # favicon viewBox is 32x32
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bg = (27, 30, 40, 255)       # #1b1e28
    gold = (226, 178, 87, 255)   # #e2b257
    w = max(2, round(2 * s))     # stroke width

    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=round(6 * s), fill=bg)
    # calendar body
    d.rounded_rectangle([4 * s, 8 * s, 28 * s, 28 * s], radius=round(3 * s), outline=gold, width=w)
    # header line
    d.line([4 * s, 14 * s, 28 * s, 14 * s], fill=gold, width=w)
    # binder rings
    for x in (10, 22):
        d.line([x * s, 5 * s, x * s, 11 * s], fill=gold, width=w)
    # dot
    r = 2.5 * s
    d.ellipse([16 * s - r, 21 * s - r, 16 * s + r, 21 * s + r], fill=gold)
    img.save(path)
    print(path)

make(192, "icon-192.png")
make(512, "icon-512.png")
