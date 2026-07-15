#!/usr/bin/env python
"""Validate static HTML metadata, accessibility basics, JSON-LD, and local references."""
from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urldefrag, urlparse

ROOT = Path(__file__).resolve().parents[1]
PRIMARY_PAGES = {
    "index.html",
    "soy-nuevo.html",
    "sobre-nosotros.html",
    "mensajes.html",
    "ministerios-eventos.html",
    "dar.html",
    "contacto-oracion.html",
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title_parts: list[str] = []
        self.in_title = False
        self.h1_count = 0
        self.images: list[dict[str, str | None]] = []
        self.references: list[str] = []
        self.canonical: str | None = None
        self.description: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "img":
            self.images.append(values)
        elif tag == "meta" and values.get("name") == "description":
            self.description = values.get("content")
        elif tag == "link" and values.get("rel") == "canonical":
            self.canonical = values.get("href")
        for attribute in ("href", "src"):
            if values.get(attribute):
                self.references.append(values[attribute] or "")

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False


def local_reference_exists(page: Path, reference: str) -> bool:
    if not reference or reference.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return True
    parsed = urlparse(reference)
    if parsed.scheme or parsed.netloc or reference.startswith("//"):
        return True
    clean = urldefrag(reference)[0].split("?", 1)[0]
    if not clean:
        return True
    target = ROOT / clean.lstrip("/") if clean.startswith("/") else page.parent / clean
    target = target.resolve()
    return target.exists() or (not target.suffix and target.with_suffix(".html").exists())


def main() -> int:
    errors: list[str] = []
    titles: dict[str, Path] = {}

    for page in sorted(ROOT.rglob("*.html")):
        if ".git" in page.parts:
            continue
        text = page.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(text)
        relative = page.relative_to(ROOT).as_posix()

        if page.name != "googlecb3afce24acdb0bc.html":
            title = "".join(parser.title_parts).strip()
            if not title:
                errors.append(f"{relative}: missing title")
            elif relative in PRIMARY_PAGES and title in titles:
                errors.append(f"{relative}: duplicate title also used by {titles[title]}")
            else:
                titles[title] = page
            if parser.h1_count != 1:
                errors.append(f"{relative}: expected one h1, found {parser.h1_count}")

        if relative in PRIMARY_PAGES:
            if not parser.description:
                errors.append(f"{relative}: missing meta description")
            if not parser.canonical:
                errors.append(f"{relative}: missing canonical URL")
            for payload in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.DOTALL):
                try:
                    json.loads(payload)
                except json.JSONDecodeError as error:
                    errors.append(f"{relative}: invalid JSON-LD: {error}")

        for image in parser.images:
            missing = [key for key in ("alt", "width", "height", "decoding") if key not in image]
            if missing:
                errors.append(f"{relative}: image {image.get('src')} missing {', '.join(missing)}")

        for reference in parser.references:
            if not local_reference_exists(page, reference):
                errors.append(f"{relative}: missing local reference {reference}")

    if "fonts.googleapis.com" in (ROOT / "index.html").read_text(encoding="utf-8"):
        errors.append("index.html: Google Fonts must not block first render")

    print(f"static_errors={len(errors)}")
    for error in errors:
        print(error)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
