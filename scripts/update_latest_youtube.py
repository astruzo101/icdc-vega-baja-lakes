#!/usr/bin/env python3
"""Bake the latest YouTube upload ID into mensajes.html.

Uses the public YouTube Atom feed rather than the Data API so the scheduled
update does not need to store a frontend API key in the repository.
"""
from __future__ import annotations

import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

CHANNEL_ID = "UC04RStpjoygWye2awbRM64w"
CHANNEL_HANDLE = "ICDCVegaBajaLakes"
FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
HANDLE_VIDEOS_URL = f"https://www.youtube.com/@{CHANNEL_HANDLE}/videos"
USER_AGENT = "ICDC-VBL-site-updater/1.0"
ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "mensajes.html"
VIDEO_ID_RE = re.compile(r'data-fallback-video-id="[^"]*"')
YOUTUBE_VIDEO_ID_RE = re.compile(r'"videoId":"([0-9A-Za-z_-]{11})"')


def read_url(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def latest_video_id_from_feed() -> str:
    xml = read_url(FEED_URL)
    root = ET.fromstring(xml)
    ns = {"atom": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
    entry = root.find("atom:entry", ns)
    if entry is None:
        raise RuntimeError("YouTube feed has no entries")
    video = entry.find("yt:videoId", ns)
    if video is None or not video.text:
        raise RuntimeError("YouTube feed entry has no video ID")
    return video.text.strip()


def latest_video_id_from_handle_page() -> str:
    html = read_url(HANDLE_VIDEOS_URL).decode("utf-8", errors="ignore")
    match = YOUTUBE_VIDEO_ID_RE.search(html)
    if match is None:
        raise RuntimeError("YouTube handle videos page has no video ID")
    return match.group(1)


def latest_video_id() -> str:
    try:
        return latest_video_id_from_feed()
    except (RuntimeError, ET.ParseError, urllib.error.URLError) as feed_error:
        print(f"YouTube Atom feed unavailable, falling back to handle page: {feed_error}", file=sys.stderr)
        return latest_video_id_from_handle_page()


def main() -> int:
    video_id = latest_video_id()
    html = HTML_PATH.read_text(encoding="utf-8")
    replacement = f'data-fallback-video-id="{video_id}"'
    if VIDEO_ID_RE.search(html):
        updated = VIDEO_ID_RE.sub(replacement, html, count=1)
    else:
        updated = html.replace("<iframe data-youtube-iframe ", f"<iframe data-youtube-iframe {replacement} ", 1)
    if updated == html:
        print(f"Latest YouTube fallback already current: {video_id}")
        return 0
    HTML_PATH.write_text(updated, encoding="utf-8")
    print(f"Updated latest YouTube fallback video ID: {video_id}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
