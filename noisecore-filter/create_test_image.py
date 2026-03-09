#!/usr/bin/env python3
"""
Create non-anime test images (abstract silhouettes) for NOISECORE testing.
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def create_silhouette(size: tuple = (512, 512)) -> Image.Image:
    """Generate an abstract human silhouette on a dark background."""
    W, H = size
    img = Image.new("RGB", (W, H), (15, 10, 10))
    draw = ImageDraw.Draw(img)

    cx = W // 2

    # Head
    head_r = W // 8
    head_y = H // 5
    draw.ellipse(
        [cx - head_r, head_y - head_r, cx + head_r, head_y + head_r],
        fill=(80, 40, 30)
    )

    # Torso
    shoulder_w = W // 4
    torso_top = head_y + head_r
    torso_bottom = int(H * 0.65)
    draw.polygon([
        (cx - shoulder_w, torso_top + 20),
        (cx + shoulder_w, torso_top + 20),
        (cx + shoulder_w - 20, torso_bottom),
        (cx - shoulder_w + 20, torso_bottom),
    ], fill=(60, 30, 20))

    # Legs
    leg_bottom = int(H * 0.92)
    draw.polygon([
        (cx - shoulder_w + 20, torso_bottom),
        (cx - 8, torso_bottom),
        (cx - 15, leg_bottom),
        (cx - shoulder_w + 30, leg_bottom),
    ], fill=(50, 25, 18))
    draw.polygon([
        (cx + 8, torso_bottom),
        (cx + shoulder_w - 20, torso_bottom),
        (cx + shoulder_w - 30, leg_bottom),
        (cx + 15, leg_bottom),
    ], fill=(50, 25, 18))

    # Blur for softness
    img = img.filter(ImageFilter.GaussianBlur(radius=3))

    # Add some ambient light spots
    light = Image.new("RGB", (W, H), (0, 0, 0))
    light_draw = ImageDraw.Draw(light)
    for _ in range(5):
        lx = np.random.randint(0, W)
        ly = np.random.randint(0, H)
        lr = np.random.randint(40, 120)
        light_draw.ellipse(
            [lx - lr, ly - lr, lx + lr, ly + lr],
            fill=(30, 12, 8)
        )
    light = light.filter(ImageFilter.GaussianBlur(radius=30))

    # Combine
    arr = np.array(img, dtype=np.float32) + np.array(light, dtype=np.float32)
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def create_abstract_portrait(size: tuple = (512, 640)) -> Image.Image:
    """Generate an abstract portrait-like image."""
    W, H = size
    arr = np.zeros((H, W, 3), dtype=np.float32)

    # Gradient background (dark red to black)
    for y in range(H):
        t = y / H
        arr[y, :, 0] = 30 * (1 - t)  # Red fades down
        arr[y, :, 1] = 8 * (1 - t)
        arr[y, :, 2] = 5 * (1 - t)

    # Central bright region (face area)
    cy, cx = H // 3, W // 2
    Y, X = np.mgrid[0:H, 0:W]
    dist = np.sqrt(((X - cx) / (W * 0.3)) ** 2 + ((Y - cy) / (H * 0.25)) ** 2)
    mask = np.clip(1.0 - dist, 0, 1) ** 2
    arr[:, :, 0] += mask * 100
    arr[:, :, 1] += mask * 45
    arr[:, :, 2] += mask * 25

    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    img = img.filter(ImageFilter.GaussianBlur(radius=5))
    return img


if __name__ == "__main__":
    sil = create_silhouette()
    sil.save("test_silhouette.png")
    print("Saved test_silhouette.png")

    port = create_abstract_portrait()
    port.save("test_portrait.png")
    print("Saved test_portrait.png")
