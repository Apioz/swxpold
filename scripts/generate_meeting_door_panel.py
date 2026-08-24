"""Generate meeting room door panel by editing the clean source image in code."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src/assets/meeting-room-door-source.png")
QR_BOOK = os.path.join(ROOT, "src/assets/mini-program-book-qrcode.png")

OUT_PANEL = os.path.join(ROOT, "meeting-room-door-panel.png")
OUT_PANEL_ASSET = os.path.join(ROOT, "src/assets/meeting-room-door-panel.png")
OUT_PANEL_HD = os.path.join(ROOT, "exports/meeting-room-door-panel-hd.png")

HD_SCALE = 2

# layout (1024 x 640)
MARGIN_LEFT = 341
MARGIN_RIGHT = 1008
CARD_Y = 150
CARD_H = 129
GAP = 12
QR_W = 155
MEET_W = MARGIN_RIGHT - MARGIN_LEFT - 2 * QR_W - 2 * GAP

GRID_Y = 421
GRID_COLS = 6
CELL_H = 43
GAP_X = 10
GAP_Y = 9

# sampled from 扫码开门 button on clean source
OCCUPIED_FILL = (0, 140, 255)
OCCUPIED_OUTLINE = (0, 125, 235)

ICON_CLOCK = (365, 212, 391, 238)
ICON_PERSON = (365, 248, 391, 274)
ICON_GROUP = (365, 264, 391, 290)
QR_CHECKIN = (818, 188, 908, 278)


def load_fonts():
    title = body = label = time_font = status = ImageFont.load_default()
    for fp in [r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\msyh.ttc"]:
        if os.path.exists(fp):
            title = ImageFont.truetype(fp, 20)
            body = ImageFont.truetype(fp, 13)
            label = ImageFont.truetype(fp, 14)
            time_font = ImageFont.truetype(fp, 12)
            status = ImageFont.truetype(fp, 11)
            break
    return title, body, label, time_font, status


def gradient_fill(img: Image.Image, orig: Image.Image, x0: int, y0: int, x1: int, y1: int, *, y_top: int, y_bottom: int) -> None:
    px = img.load()
    for y in range(y0, y1):
        t = (y - y0) / max(y1 - y0 - 1, 1)
        for x in range(x0, x1):
            r1, g1, b1 = orig.getpixel((x, y_top))
            r2, g2, b2 = orig.getpixel((x, y_bottom))
            px[x, y] = (
                int(r1 * (1 - t) + r2 * t),
                int(g1 * (1 - t) + g2 * t),
                int(b1 * (1 - t) + b2 * t),
            )


def draw_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0 + 1, y0 + 2, x1 + 1, y1 + 2], radius=14, fill=(208, 218, 228))
    draw.rounded_rectangle(box, radius=14, fill=(255, 255, 255), outline=(228, 234, 242), width=1)


def draw_meeting_card(draw: ImageDraw.ImageDraw, img: Image.Image, orig: Image.Image, box: tuple[int, int, int, int], fonts) -> None:
    title_font, body_font, _, _, _ = fonts
    draw_card(draw, box)
    x0, y0 = box[0], box[1]

    draw.text((x0 + 16, y0 + 14), "技术部周会", fill=(31, 45, 66), font=title_font)

    rows = [
        (ICON_CLOCK, "会议时间：14:00-15:00"),
        (ICON_GROUP, "参会人员：30"),
        (ICON_PERSON, "预约人：禹创会议助理"),
    ]
    y = y0 + 46
    for icon_box, text in rows:
        icon = orig.crop(icon_box)
        img.paste(icon, (x0 + 16, y))
        draw.text((x0 + 40, y + 1), text, fill=(74, 85, 104), font=body_font)
        y += 24


def draw_qr_card(
    draw: ImageDraw.ImageDraw,
    img: Image.Image,
    orig: Image.Image,
    box: tuple[int, int, int, int],
    label: str,
    qr: Image.Image | None,
    fonts,
    *,
    from_orig: tuple[int, int, int, int] | None = None,
) -> None:
    _, _, label_font, _, _ = fonts
    draw_card(draw, box)
    cx, cy = box[0], box[1]
    cw = box[2] - box[0]

    lb = draw.textbbox((0, 0), label, font=label_font)
    lw = lb[2] - lb[0]
    draw.text((cx + (cw - lw) // 2, cy + 10), label, fill=(51, 65, 85), font=label_font)

    qr_size = 96
    qx = cx + (cw - qr_size) // 2
    qy = cy + 30

    if from_orig is not None:
        patch = orig.crop(from_orig).resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        img.paste(patch, (qx, qy))
    elif qr is not None:
        patch = qr.convert("RGBA").resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        img.paste(patch, (qx, qy), patch)


def draw_schedule(draw: ImageDraw.ImageDraw, fonts) -> None:
    _, _, _, time_font, status_font = fonts
    content_w = MARGIN_RIGHT - MARGIN_LEFT
    base = (content_w - (GRID_COLS - 1) * GAP_X) // GRID_COLS
    extra = content_w - (GRID_COLS - 1) * GAP_X - base * GRID_COLS
    col_widths = [base + (1 if i < extra else 0) for i in range(GRID_COLS)]

    slots: list[tuple[str, str]] = []
    for hr in range(9, 18):
        slots.append((f"{hr:02d}:00", f"{hr:02d}:30"))
        slots.append((f"{hr:02d}:30", f"{hr + 1:02d}:00"))

    booked = [("09:30", "11:00"), ("14:00", "15:00"), ("16:00", "17:00")]

    def to_min(t: str) -> int:
        h, m = map(int, t.split(":"))
        return h * 60 + m

    def is_booked(start: str, end: str) -> bool:
        sm, em = to_min(start), to_min(end)
        return any(sm < to_min(be) and em > to_min(bs) for bs, be in booked)

    x = MARGIN_LEFT
    col_x: list[int] = []
    for cw in col_widths:
        col_x.append(x)
        x += cw + GAP_X

    for i, (start, end) in enumerate(slots):
        row, col = divmod(i, GRID_COLS)
        x0 = col_x[col]
        cw = col_widths[col]
        y0 = GRID_Y + row * (CELL_H + GAP_Y)
        x1, y1 = x0 + cw, y0 + CELL_H
        occupied = is_booked(start, end)
        if occupied:
            fill, outline, tc, sc, label = OCCUPIED_FILL, OCCUPIED_OUTLINE, (255, 255, 255), (230, 244, 255), "已占用"
        else:
            fill, outline, tc, sc, label = (255, 255, 255), (210, 218, 228), (71, 85, 105), (148, 163, 184), "可预约"
        draw.rounded_rectangle([x0, y0, x1, y1], radius=6, fill=fill, outline=outline, width=1)
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        draw.text((cx, cy - 8), f"{start}-{end}", fill=tc, font=time_font, anchor="mm")
        draw.text((cx, cy + 9), label, fill=sc, font=status_font, anchor="mm")


def build_panel() -> Image.Image:
    orig = Image.open(SRC).convert("RGB")
    img = orig.copy()

    # wipe old 2-card row + bottom meeting carousel, keep logo/clock/今日会议 title
    gradient_fill(img, orig, 325, 125, 1018, 312, y_top=118, y_bottom=330)
    gradient_fill(img, orig, 325, 421, 1018, 585, y_top=360, y_bottom=600)

    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    meet_box = (MARGIN_LEFT, CARD_Y, MARGIN_LEFT + MEET_W, CARD_Y + CARD_H)
    book_box = (meet_box[2] + GAP, CARD_Y, meet_box[2] + GAP + QR_W, CARD_Y + CARD_H)
    check_box = (book_box[2] + GAP, CARD_Y, book_box[2] + GAP + QR_W, CARD_Y + CARD_H)

    draw_meeting_card(draw, img, orig, meet_box, fonts)
    draw_qr_card(draw, img, orig, book_box, "扫码预约", Image.open(QR_BOOK), fonts)
    draw_qr_card(draw, img, orig, check_box, "扫码签到", None, fonts, from_orig=QR_CHECKIN)
    draw_schedule(draw, fonts)
    return img


def main():
    os.makedirs(os.path.dirname(OUT_PANEL_HD), exist_ok=True)
    panel = build_panel()
    panel.save(OUT_PANEL, "PNG", optimize=False)
    panel.save(OUT_PANEL_ASSET, "PNG", optimize=False)

    w, h = panel.size
    hd = panel.resize((w * HD_SCALE, h * HD_SCALE), Image.Resampling.LANCZOS)
    hd.save(OUT_PANEL_HD, "PNG", optimize=False)
    print("saved", OUT_PANEL, f"{w}x{h}")
    print("saved HD", OUT_PANEL_HD, f"{hd.size[0]}x{hd.size[1]}")


if __name__ == "__main__":
    main()
