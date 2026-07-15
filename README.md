# ICDC Vega Baja Lakes Website

Production static website for Iglesia Cristiana Discípulos de Cristo en Vega Baja Lakes.

## Deployment

This repository is designed for GitHub Pages deployed from the repository root. No build step is required.

## Local preview

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Structure

- `index.html` — homepage
- `soy-nuevo.html` — first-time visitor page
- `sobre-nosotros.html` — about page
- `mensajes.html` — YouTube messages page
- `ministerios-eventos.html` — ministries and events page
- `dar.html` — giving page
- `contacto-oracion.html` — contact and prayer page
- `404.html` — GitHub Pages fallback
- `assets/img/` — local production images and responsive AVIF/WebP variants
- `assets/fonts/` — self-hosted DM Sans webfont and license
- `styles.css` and `script.js` — global assets
- `scripts/optimize_images.py` — reproducible responsive image generation
- `scripts/validate_site.py` — HTML, metadata, JSON-LD, and local-link validation
- `sitemap.xml`, `robots.txt`, `CNAME` — deployment/SEO assets

## Quality checks

```bash
python scripts/validate_site.py
node --check script.js
node --check live-stream.js
```

Responsive image variants can be regenerated after replacing source photography:

```bash
python scripts/optimize_images.py
```

## Content notes

The site uses confirmed public information from the existing church web presence: service times, phone, giving links, YouTube, Facebook, and imagery.
