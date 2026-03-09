#!/usr/bin/env python3
"""
Test run — generates sample NOISECORE cards to verify output.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from create_test_image import create_silhouette, create_abstract_portrait
from caption_layout import build_card, build_all_sizes, INSTAGRAM_SQUARE
from noisecore_filter import apply_noisecore

OUTPUT = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT, exist_ok=True)


def test_filter_only():
    """Test the raw noisecore filter on a silhouette."""
    print("[TEST] Filter-only on silhouette...")
    img = create_silhouette((1080, 1080))
    result = apply_noisecore(img)
    path = os.path.join(OUTPUT, "test_filter_only.png")
    result.save(path)
    print(f"  -> {path}")


def test_card_with_photo():
    """Test a full card with artist photo (Dro Kenji style)."""
    print("[TEST] Card with artist photo...")
    photo = create_abstract_portrait((512, 640))
    card = build_card(
        title="DRO KENJI",
        body=(
            "Boasting 435K+ monthly listeners and a loyal fanbase.\n\n"
            "**Time Away dropped in February to critical acclaim.**\n\n"
            "Currently embarked on a based tour.\n\n"
            "Under no circumstances is he to be underestimated."
        ),
        footer="NOISECORE // DREAMLOG 1",
        artist_photo=photo,
        size=INSTAGRAM_SQUARE,
    )
    path = os.path.join(OUTPUT, "test_card_drokenji.png")
    card.save(path)
    print(f"  -> {path}")


def test_card_no_photo():
    """Test a text-only card."""
    print("[TEST] Card without photo...")
    card = build_card(
        title="GET NAKED AND DANCE",
        body=(
            "Dc The Don has done it again, he's continuously pushed new norms "
            "back toward the goalpost, and he's attempting to kick a game ending goal.\n\n"
            "We picked him up as a NOISE entity for a reason, he adapts, he's himself, "
            "and he's here to stay."
        ),
        footer="NOISECORE // DREAMLOG 04",
        size=INSTAGRAM_SQUARE,
    )
    path = os.path.join(OUTPUT, "test_card_nophoto.png")
    card.save(path)
    print(f"  -> {path}")


def test_all_sizes():
    """Test generating all social media sizes."""
    print("[TEST] All sizes...")
    photo = create_silhouette((512, 512))
    cards = build_all_sizes(
        title="FROM THE EARTH TO ANGEL HEIGHTS",
        body=(
            "Boasting one of the deepest unclassified signals in the new gen.\n\n"
            "**Artist Oshua came across our radar by being silent in noise but rich in energy.**\n\n"
            "Angel Heights and his upcoming album are some of the best music pieces dropped recently.\n\n"
            "**Watch out for this one.**\n"
            "By the time you hear about him, it'll be too late."
        ),
        footer="NOISECORE // DREAMLOG 02",
        artist_photo=photo,
        caption="Oshua - Angel Heights",
    )
    for name, img in cards.items():
        path = os.path.join(OUTPUT, f"test_{name}.png")
        img.save(path)
        print(f"  -> {path} ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    test_filter_only()
    test_card_with_photo()
    test_card_no_photo()
    test_all_sizes()
    print(f"\n[DONE] All tests passed — check {OUTPUT}/")
