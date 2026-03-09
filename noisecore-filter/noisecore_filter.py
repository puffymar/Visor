"""
Noisecore Filter — grain, scanlines, red/orange tint, glow borders.
Transforms any input image into the NOISECORE aesthetic.
"""

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw


def apply_red_orange_tint(img: Image.Image, strength: float = 0.85) -> Image.Image:
    """Shift image toward deep red/orange tint."""
    arr = np.array(img, dtype=np.float32)
    # Boost red channel, slightly boost green for orange warmth, crush blue
    arr[:, :, 0] = np.clip(arr[:, :, 0] * (0.6 + 0.5 * strength), 0, 255)
    arr[:, :, 1] = np.clip(arr[:, :, 1] * (0.25 + 0.15 * strength), 0, 255)
    arr[:, :, 2] = np.clip(arr[:, :, 2] * (0.08), 0, 255)
    return Image.fromarray(arr.astype(np.uint8))


def apply_grain(img: Image.Image, intensity: float = 40) -> Image.Image:
    """Add film-grain noise."""
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, intensity, arr.shape)
    arr = np.clip(arr + noise, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))


def apply_scanlines(img: Image.Image, spacing: int = 3, alpha: float = 0.3) -> Image.Image:
    """Overlay horizontal scanlines."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(0, img.height, spacing):
        draw.line([(0, y), (img.width, y)], fill=(0, 0, 0, int(255 * alpha)), width=1)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    return Image.alpha_composite(img, overlay).convert("RGB")


def apply_vignette(img: Image.Image, strength: float = 0.7) -> Image.Image:
    """Dark vignette edges."""
    w, h = img.size
    arr = np.array(img, dtype=np.float32)
    cx, cy = w / 2, h / 2
    max_dist = np.sqrt(cx ** 2 + cy ** 2)
    Y, X = np.mgrid[0:h, 0:w]
    dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
    vignette = 1.0 - strength * (dist / max_dist) ** 1.5
    vignette = np.clip(vignette, 0, 1)
    for c in range(3):
        arr[:, :, c] *= vignette
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def apply_glow_border(img: Image.Image, color: tuple = (255, 50, 0),
                      thickness: int = 3, glow_size: int = 8,
                      margin: int = 12) -> Image.Image:
    """Draw a glowing neon border inset from the edge."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    glow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow_layer)

    # Glow passes (outer to inner, fading)
    for i in range(glow_size, 0, -1):
        alpha = int(80 * (i / glow_size))
        r, g, b = color
        m = margin - i
        draw.rectangle(
            [m, m, img.width - 1 - m, img.height - 1 - m],
            outline=(r, g, b, alpha), width=1
        )

    # Core border
    draw.rectangle(
        [margin, margin, img.width - 1 - margin, img.height - 1 - margin],
        outline=(*color, 255), width=thickness
    )

    result = Image.alpha_composite(img, glow_layer)
    return result.convert("RGB")


def apply_noisecore(img: Image.Image,
                    tint_strength: float = 0.85,
                    grain_intensity: float = 35,
                    scanline_spacing: int = 3,
                    scanline_alpha: float = 0.25,
                    vignette_strength: float = 0.6,
                    border_color: tuple = (255, 50, 0),
                    border_thickness: int = 3,
                    glow_size: int = 10,
                    border_margin: int = 14) -> Image.Image:
    """Full noisecore pipeline on a raw image."""
    # Darken overall
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(0.55)

    # Boost contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.4)

    img = apply_red_orange_tint(img, tint_strength)
    img = apply_vignette(img, vignette_strength)
    img = apply_grain(img, grain_intensity)
    img = apply_scanlines(img, scanline_spacing, scanline_alpha)
    img = apply_glow_border(img, border_color, border_thickness, glow_size, border_margin)
    return img
