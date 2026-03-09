"""
Caption Layout — builds the NOISECORE card for Instagram/TikTok.

Layout (based on NOISECOREtv Instagram posts):
┌──────────────────────────────────┐
│  ┌─ glow border ──────────────┐  │
│  │  TITLE (big, red/orange)   │  │
│  │                            │  │
│  │  Body text     ┌────────┐  │  │
│  │  (green)       │ ARTIST │  │  │
│  │  wrapping      │ PHOTO  │  │  │
│  │  left of       │(tinted)│  │  │
│  │  photo         └────────┘  │  │
│  │                            │  │
│  │  More body text continues  │  │
│  │  below the photo area      │  │
│  │                            │  │
│  │ ────────────────────────── │  │
│  │  NOISECORE // DREAMLOG 03  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
"""

import textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
from noisecore_filter import (
    apply_grain, apply_scanlines, apply_glow_border,
    apply_red_orange_tint, apply_vignette
)

# --- Color palette (from reference) ---
BG_COLOR = (8, 5, 5)
TITLE_COLOR = (255, 60, 10)        # Bright red-orange
BODY_COLOR = (50, 180, 60)         # Green body text
HIGHLIGHT_COLOR = (255, 70, 20)    # Red for emphasis / italic text
FOOTER_LABEL = (255, 50, 0)        # "NOISECORE" red
FOOTER_VALUE = (40, 170, 50)       # "DREAMLOG" green
DIVIDER_COLOR = (200, 50, 0)       # Horizontal rule
PHOTO_BORDER = (255, 50, 0)        # Glow around artist photo


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Load a monospace / bold font, fallback to default."""
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    if bold:
        # Prefer bold fonts first
        bold_paths = [p for p in paths if "Bold" in p] + paths
    else:
        bold_paths = paths

    for p in bold_paths:
        try:
            return ImageFont.truetype(p, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def _wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = font.getbbox(test)
        if bbox[2] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _draw_glow_text(draw: ImageDraw.Draw, pos: tuple, text: str,
                    font: ImageFont.FreeTypeFont, fill: tuple,
                    glow_radius: int = 2):
    """Draw text with a subtle neon glow."""
    x, y = pos
    # Glow passes
    glow_color = (*fill[:3], 60) if len(fill) == 3 else (*fill[:3], 60)
    for dx in range(-glow_radius, glow_radius + 1):
        for dy in range(-glow_radius, glow_radius + 1):
            if dx == 0 and dy == 0:
                continue
            draw.text((x + dx, y + dy), text, font=font, fill=glow_color)
    # Core text
    draw.text((x, y), text, font=font, fill=fill)


def _process_artist_photo(photo: Image.Image, target_size: tuple) -> Image.Image:
    """Apply noisecore tint to artist photo and resize."""
    photo = photo.convert("RGB")
    # Crop to square-ish aspect
    w, h = photo.size
    if w > h:
        left = (w - h) // 2
        photo = photo.crop((left, 0, left + h, h))
    elif h > w:
        top = (h - w) // 2
        photo = photo.crop((0, top, w, top + w))

    photo = photo.resize(target_size, Image.LANCZOS)
    photo = apply_red_orange_tint(photo, strength=0.7)
    from PIL import ImageEnhance
    photo = ImageEnhance.Brightness(photo).enhance(0.6)
    photo = ImageEnhance.Contrast(photo).enhance(1.3)
    return photo


def build_card(
    title: str,
    body: str,
    footer: str,
    artist_photo: Image.Image | None = None,
    size: tuple = (1080, 1080),
    caption: str | None = None,
) -> Image.Image:
    """
    Build a single NOISECORE card.

    Args:
        title: Big header text (e.g. "GET NAKED AND DANCE")
        body: Multi-paragraph body text
        footer: Footer string (e.g. "NOISECORE // DREAMLOG 03")
        artist_photo: Optional PIL image of the artist
        size: Output dimensions (width, height)
        caption: Optional small caption under photo
    """
    W, H = size
    card = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(card)

    # Margins inside the glow border
    MARGIN = 30
    INNER = MARGIN + 18  # Inside the border line
    content_x = INNER + 8
    content_right = W - INNER - 8

    # --- Fonts ---
    title_font = _load_font(int(W * 0.058), bold=True)
    body_font = _load_font(int(W * 0.030), bold=False)
    body_bold = _load_font(int(W * 0.031), bold=True)
    footer_font = _load_font(int(W * 0.032), bold=True)
    caption_font = _load_font(int(W * 0.022), bold=False)

    y_cursor = INNER + 12

    # --- Title ---
    title_upper = title.upper()
    title_lines = _wrap_text(title_upper, title_font, content_right - content_x)
    for line in title_lines:
        bbox = title_font.getbbox(line)
        tw = bbox[2] - bbox[0]
        tx = content_x + (content_right - content_x - tw) // 2  # Center
        _draw_glow_text(draw, (tx, y_cursor), line, title_font, TITLE_COLOR, glow_radius=3)
        y_cursor += bbox[3] - bbox[1] + 8

    y_cursor += 16

    # --- Artist photo (right side) ---
    photo_w = int(W * 0.38)
    photo_h = int(W * 0.45)
    photo_x = content_right - photo_w
    photo_y = y_cursor
    text_right_limit = content_right  # Default full width

    if artist_photo is not None:
        processed = _process_artist_photo(artist_photo, (photo_w, photo_h))
        card.paste(processed, (photo_x, photo_y))

        # Photo border glow
        draw = ImageDraw.Draw(card)
        for i in range(6, 0, -1):
            alpha_val = int(120 * (i / 6))
            border_col = (*PHOTO_BORDER[:3],)
            # Approximate glow with lighter color
            glow_r = min(255, PHOTO_BORDER[0] + 40)
            glow_g = min(255, PHOTO_BORDER[1] + 20)
            glow_b = min(255, PHOTO_BORDER[2] + 10)
            draw.rectangle(
                [photo_x - i, photo_y - i,
                 photo_x + photo_w + i, photo_y + photo_h + i],
                outline=(glow_r, glow_g, glow_b), width=1
            )
        draw.rectangle(
            [photo_x - 1, photo_y - 1,
             photo_x + photo_w + 1, photo_y + photo_h + 1],
            outline=PHOTO_BORDER, width=2
        )

        text_right_limit = photo_x - 16  # Body text wraps left of photo

        # Caption under photo
        if caption:
            cap_y = photo_y + photo_h + 8
            cap_lines = _wrap_text(caption, caption_font, photo_w)
            for cl in cap_lines:
                draw.text((photo_x, cap_y), cl, font=caption_font, fill=HIGHLIGHT_COLOR)
                cap_y += caption_font.getbbox(cl)[3] + 4

    # --- Body text ---
    paragraphs = body.strip().split("\n")
    line_height = int(body_font.getbbox("Ag")[3] * 1.45)

    for para in paragraphs:
        para = para.strip()
        if not para:
            y_cursor += line_height // 2
            continue

        # Check if this paragraph is bold/highlight (starts with **)
        is_bold = para.startswith("**") and para.endswith("**")
        if is_bold:
            para = para[2:-2]
            current_font = body_bold
            current_color = HIGHLIGHT_COLOR
        else:
            current_font = body_font
            current_color = BODY_COLOR

        # Determine text width — wrap around photo if we're in that zone
        if y_cursor < photo_y + photo_h + 20 and artist_photo is not None:
            wrap_width = text_right_limit - content_x
        else:
            wrap_width = content_right - content_x

        wrapped = _wrap_text(para, current_font, wrap_width)
        for wl in wrapped:
            draw.text((content_x, y_cursor), wl, font=current_font, fill=current_color)
            y_cursor += line_height

        y_cursor += 6  # Paragraph spacing

    # --- Divider line ---
    div_y = H - INNER - 60
    if y_cursor > div_y - 20:
        div_y = y_cursor + 20
    draw.line(
        [(content_x, div_y), (content_right, div_y)],
        fill=DIVIDER_COLOR, width=2
    )

    # --- Footer ---
    footer_y = div_y + 14
    # Split on "//" for two-color rendering
    if "//" in footer:
        parts = footer.split("//", 1)
        left_text = parts[0].strip()
        right_text = parts[1].strip()

        draw.text((content_x, footer_y), left_text, font=footer_font, fill=FOOTER_LABEL)
        lw = footer_font.getbbox(left_text)[2]
        sep_x = content_x + lw + 6
        draw.text((sep_x, footer_y), "//", font=footer_font, fill=FOOTER_LABEL)
        sep_w = footer_font.getbbox("//")[2]
        draw.text((sep_x + sep_w + 8, footer_y), right_text,
                  font=footer_font, fill=FOOTER_VALUE)
    else:
        draw.text((content_x, footer_y), footer, font=footer_font, fill=FOOTER_LABEL)

    # --- Post-processing: grain + scanlines (on whole card) ---
    card = apply_grain(card, intensity=25)
    card = apply_scanlines(card, spacing=3, alpha=0.18)

    # --- Glow border ---
    card = apply_glow_border(card, color=PHOTO_BORDER, thickness=3,
                             glow_size=10, margin=MARGIN)

    return card


# --- Preset sizes for social platforms ---
INSTAGRAM_SQUARE = (1080, 1080)
INSTAGRAM_PORTRAIT = (1080, 1350)
INSTAGRAM_REELS = (1080, 1920)
TIKTOK = (1080, 1920)


def build_all_sizes(title: str, body: str, footer: str,
                    artist_photo: Image.Image | None = None,
                    caption: str | None = None) -> dict[str, Image.Image]:
    """Build cards for all social media sizes."""
    sizes = {
        "instagram_square": INSTAGRAM_SQUARE,
        "instagram_portrait": INSTAGRAM_PORTRAIT,
        "instagram_reels": INSTAGRAM_REELS,
        "tiktok": TIKTOK,
    }
    results = {}
    for name, sz in sizes.items():
        results[name] = build_card(title, body, footer, artist_photo, sz, caption)
    return results
