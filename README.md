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
- `assets/img/` — local production images
- `styles.css` and `script.js` — global assets
- `sitemap.xml`, `robots.txt`, `CNAME` — deployment/SEO assets

## Content notes

The site uses confirmed public information from the existing church web presence: service times, phone, giving links, YouTube, Facebook, and imagery.
