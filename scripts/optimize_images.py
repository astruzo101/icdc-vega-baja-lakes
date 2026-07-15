#!/usr/bin/env python
"""Generate responsive production image variants for the static site."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets" / "img"


def resized(source: Path, width: int) -> Image.Image:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        if image.width <= width:
            return image.copy()
        height = round(image.height * width / image.width)
        return image.resize((width, height), Image.Resampling.LANCZOS)


def save_variants(source_name: str, widths: tuple[int, ...], *, quality: int = 70) -> None:
    source = IMAGES / source_name
    stem = source.stem
    for width in widths:
        image = resized(source, width)
        for extension, options in (
            ("avif", {"quality": quality, "speed": 6}),
            ("webp", {"quality": quality + 6, "method": 6}),
        ):
            destination = source.with_name(f"{stem}-{width}.{extension}")
            image.save(destination, extension.upper(), **options)
            print(f"{destination.relative_to(ROOT)}: {destination.stat().st_size} bytes")


def save_logo() -> None:
    source = IMAGES / "logo.png"
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGBA")
        for width in (96, 192):
            height = round(image.height * width / image.width)
            output = image.resize((width, height), Image.Resampling.LANCZOS)
            destination = IMAGES / f"logo-{width}.webp"
            output.save(destination, "WEBP", quality=86, method=6)
            print(f"{destination.relative_to(ROOT)}: {destination.stat().st_size} bytes")

        for size, name in ((32, "favicon-32.png"), (180, "apple-touch-icon.png")):
            inset = max(1, round(size * 0.06))
            available = size - (2 * inset)
            scale = min(available / image.width, available / image.height)
            dimensions = (round(image.width * scale), round(image.height * scale))
            logo = image.resize(dimensions, Image.Resampling.LANCZOS)
            output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            output.alpha_composite(logo, ((size - dimensions[0]) // 2, (size - dimensions[1]) // 2))
            destination = IMAGES / name
            output.save(destination, "PNG", optimize=True)
            print(f"{destination.relative_to(ROOT)}: {destination.stat().st_size} bytes")


def main() -> None:
    save_variants("worship-hero.jpg", (480, 768, 1280, 1440, 1920), quality=65)
    save_variants("worship-gathering.jpg", (480, 960), quality=64)
    save_variants("youth-group.jpg", (480, 960), quality=64)
    save_variants("youth-worship.jpg", (480, 768, 1280), quality=67)
    save_logo()


if __name__ == "__main__":
    main()
