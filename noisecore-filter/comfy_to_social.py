#!/usr/bin/env python3
"""
comfy_to_social.py — NOISECORE social media card generator.

Entry point: takes an image + text params, produces Instagram/TikTok-ready
NOISECORE cards.

Usage:
    python comfy_to_social.py \
        -t "WEEK OF WONDERS" \
        -b "Body text goes here." \
        --caption "Artist - vibe" \
        -f "NOISECORE // DREAMLOG 03" \
        -o output \
        --photo artist.jpg
"""

import argparse
import os
import sys
from pathlib import Path
from PIL import Image
from caption_layout import build_card, build_all_sizes

# Default ComfyUI output path (Windows)
COMFY_OUTPUT = r"c:\anime-creator\output"


def find_latest_image(directory: str) -> str | None:
    """Find most recently modified image in a directory."""
    if not os.path.isdir(directory):
        return None
    exts = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
    images = [
        os.path.join(directory, f) for f in os.listdir(directory)
        if os.path.splitext(f)[1].lower() in exts
    ]
    if not images:
        return None
    return max(images, key=os.path.getmtime)


def main():
    parser = argparse.ArgumentParser(
        description="NOISECORE — social media card generator"
    )
    parser.add_argument("-t", "--title", required=True,
                        help="Card title (displayed big at top)")
    parser.add_argument("-b", "--body", required=True,
                        help="Body text (use \\n for paragraphs)")
    parser.add_argument("-f", "--footer", default="NOISECORE // DREAMLOG 01",
                        help="Footer text (default: NOISECORE // DREAMLOG 01)")
    parser.add_argument("--caption", default=None,
                        help="Small caption under artist photo")
    parser.add_argument("--photo", default=None,
                        help="Path to artist photo (optional)")
    parser.add_argument("--comfy-dir", default=COMFY_OUTPUT,
                        help=f"ComfyUI output dir (default: {COMFY_OUTPUT})")
    parser.add_argument("-o", "--output-dir", default="output",
                        help="Output directory (default: output)")
    parser.add_argument("--size", default="all",
                        choices=["all", "square", "portrait", "reels", "tiktok"],
                        help="Which size(s) to generate")
    parser.add_argument("--no-comfy", action="store_true",
                        help="Skip checking ComfyUI output directory")

    args = parser.parse_args()

    # Resolve body text newlines
    body = args.body.replace("\\n", "\n")

    # Load artist photo
    photo = None
    if args.photo and os.path.isfile(args.photo):
        photo = Image.open(args.photo)
        print(f"[NOISECORE] Using artist photo: {args.photo}")
    elif not args.no_comfy:
        latest = find_latest_image(args.comfy_dir)
        if latest:
            photo = Image.open(latest)
            print(f"[NOISECORE] Using ComfyUI image: {latest}")

    if photo is None:
        print("[NOISECORE] No artist photo — card will be text-only")

    # Create output dir
    os.makedirs(args.output_dir, exist_ok=True)

    # Build cards
    size_map = {
        "square": (1080, 1080),
        "portrait": (1080, 1350),
        "reels": (1080, 1920),
        "tiktok": (1080, 1920),
    }

    if args.size == "all":
        cards = build_all_sizes(args.title, body, args.footer, photo, args.caption)
    else:
        sz = size_map[args.size]
        cards = {args.size: build_card(args.title, body, args.footer, photo, sz, args.caption)}

    # Save
    for name, img in cards.items():
        out_path = os.path.join(args.output_dir, f"noisecore_{name}.png")
        img.save(out_path, "PNG")
        print(f"[NOISECORE] Saved: {out_path} ({img.size[0]}x{img.size[1]})")

    print(f"\n[NOISECORE] Done — {len(cards)} card(s) generated in {args.output_dir}/")


if __name__ == "__main__":
    main()
