"""Regenerates public/og-image.jpg (1200x630 share card): dark-to-grey gradient with a frosted glass panel.
Run: python3 scripts/og-image.py   (needs Pillow + numpy)"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

S = 2
W, H = 1200 * S, 630 * S
FONT_B = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
FONT_R = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
FONT_J = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
font = lambda p, s, i=0: ImageFont.truetype(p, int(s * S), index=i)

# --- background: diagonal gradient, near-black -> graphite -> grey
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
t = np.clip((xx / W * 0.55 + yy / H * 0.45), 0, 1)
stops = [(0.0, (6, 6, 9)), (0.45, (20, 20, 25)), (0.78, (44, 44, 52)), (1.0, (88, 88, 98))]
bg = np.zeros((H, W, 3), np.float32)
for (a, ca), (b, cb) in zip(stops, stops[1:]):
    m = (t >= a) & (t <= b)
    k = ((t - a) / (b - a))[..., None]
    bg = np.where(m[..., None], np.array(ca) * (1 - k) + np.array(cb) * k, bg)
img = Image.fromarray(bg.astype(np.uint8)).convert('RGBA')

# --- soft colour blobs (what the glass will blur)
def blob(cx, cy, r, color, alpha):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse((cx - r, cy - r, cx + r, cy + r), fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(110 * S))
for b in [blob(170 * S, 120 * S, 260 * S, (200, 200, 215), 95), blob(120 * S, 560 * S, 230 * S, (232, 41, 76), 85), blob(1090 * S, 520 * S, 300 * S, (150, 150, 165), 110), blob(980 * S, 60 * S, 170 * S, (255, 255, 255), 60)]:
    img = Image.alpha_composite(img, b)

# --- glass panel
px0, py0, px1, py1 = 70 * S, 70 * S, 1130 * S, 560 * S
rad = 44 * S
mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(mask).rounded_rectangle((px0, py0, px1, py1), rad, fill=255)

shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle((px0, py0 + 26 * S, px1, py1 + 26 * S), rad, fill=(0, 0, 0, 150))
img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(40 * S)))

frost = img.filter(ImageFilter.GaussianBlur(34 * S))
glass = Image.new('RGBA', (W, H), (255, 255, 255, 22))
sheen = np.zeros((H, W, 4), np.uint8)
sheen[..., :3] = 255
sheen[..., 3] = np.clip(46 - (xx / W * 46) - (yy / H * 12), 0, 46).astype(np.uint8)
frost = Image.alpha_composite(Image.alpha_composite(frost, glass), Image.fromarray(sheen))
img = Image.composite(frost, img, mask)

# gradient hairline border (bright top-left, faint bottom-right)
border = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(border).rounded_rectangle((px0, py0, px1, py1), rad, outline=(255, 255, 255, 255), width=2 * S)
ba = np.clip(150 - (xx / W * 90) - (yy / H * 60), 18, 150).astype(np.uint8)
border.putalpha(ImageChops.multiply(border.split()[3], Image.fromarray(ba)))
img = Image.alpha_composite(img, border)

d = ImageDraw.Draw(img)

# --- logo tile
lx, ly, ls = 130 * S, 135 * S, 150 * S
tile = Image.new('RGBA', (W, H), (0, 0, 0, 0))
td = ImageDraw.Draw(tile)
td.rounded_rectangle((lx, ly, lx + ls, ly + ls), 34 * S, fill=(8, 8, 11, 255), outline=(255, 255, 255, 40), width=2 * S)
def P(pts, col):
    td.polygon([(lx + x * S, ly + y * S) for x, y in pts], fill=col)
red, white = (225, 29, 72, 255), (245, 245, 247, 255)
P([(40, 44), (118, 44), (112, 60), (34, 60)], red)          # top bar
P([(112, 60), (96, 60), (34, 106), (50, 106)], red)          # diagonal
P([(34, 106), (112, 106), (106, 122), (28, 122)], red)       # bottom bar
P([(104, 38), (116, 38), (46, 128), (34, 128)], white + ())  # slash
img = Image.alpha_composite(img, tile)
d = ImageDraw.Draw(img)

# --- text
d.text((318 * S, 118 * S), 'Zenkai', font=font(FONT_B, 124), fill=(246, 246, 249, 255))
d.text((322 * S, 262 * S), 'Watch anime & movies. Read manga & novels.', font=font(FONT_R, 36), fill=(200, 200, 210, 255))
d.text((322 * S, 312 * S), 'Free, fast and beautifully simple.', font=font(FONT_R, 28), fill=(150, 150, 163, 255))

# --- section pills
x = 130 * S
for label, kanji in [('Anime', 'アニメ'), ('Movies', '映画'), ('Manga', '漫画'), ('Novels', '小説')]:
    f1, f2 = font(FONT_B, 28), font(FONT_J, 24)
    w1, w2 = d.textlength(label, font=f1), d.textlength(kanji, font=f2)
    pw, ph = w1 + w2 + 74 * S, 64 * S
    y = 420 * S
    pill = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle((x, y, x + pw, y + ph), ph / 2, fill=(255, 255, 255, 26), outline=(255, 255, 255, 70), width=2 * S)
    pd.ellipse((x + 22 * S, y + ph / 2 - 6 * S, x + 34 * S, y + ph / 2 + 6 * S), fill=red)
    img = Image.alpha_composite(img, pill)
    d = ImageDraw.Draw(img)
    d.text((x + 46 * S, y + 14 * S), label, font=f1, fill=(244, 244, 247, 255))
    d.text((x + 46 * S + w1 + 12 * S, y + 17 * S), kanji, font=f2, fill=(170, 170, 182, 255))
    x += pw + 18 * S

# --- fine grain to stop gradient banding
rng = np.random.default_rng(7)
arr = np.asarray(img.convert('RGB')).astype(np.int16) + rng.integers(-2, 3, (H, W, 1))
out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).resize((1200, 630), Image.LANCZOS)
out.save('public/og-image.jpg', quality=88, optimize=True, progressive=True)
print('ok')
