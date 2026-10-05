# EVTIN Studio

Static bilingual (EN default / RU) site for Ivan Evtin's web studio. No build step.

- `index.html`, `styles.css`, `script.js` — home page
- `concept-*.html`, `concept.css`, `concept.js` — three labelled demo concepts
- `assets/` — portraits (`ivan-03.webp` used in the hero; add the file before deploying)
- Contact form posts to Formspree `mnpagjqg` via fetch, with a plain-POST fallback
- Language is stored in `localStorage` key `evtin-lang`
- `fonts/` — self-hosted Google Fonts (woff2, latin + cyrillic subsets) via `fonts/fonts.css`; shared by all pages
- SEO: `robots.txt`, `sitemap.xml`, canonical + OG/Twitter tags, `assets/og.png` (1200×630). Concept pages are `noindex` and stay out of the sitemap.
- Absolute URLs assume `https://evtstudio.netlify.app/` (index.html head, robots.txt, sitemap.xml) — update all three if the domain changes.
- No `hreflang`: RU is a client-side toggle on the same URL, so search engines index the English version. Separate `/ru/` URLs would be needed for indexed Russian pages.
