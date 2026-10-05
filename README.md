# EVTIN Studio

Static bilingual (EN default / RU) site for Ivan Evtin's web studio. No build step.

- `index.html`, `styles.css`, `script.js` — home page
- `concept-*.html`, `concept.css`, `concept.js` — three labelled demo concepts
- `assets/` — portraits (`ivan-03.webp` used in the hero; add the file before deploying)
- Contact form posts to Formspree `mnpagjqg` via fetch, with a plain-POST fallback
- Language is stored in `localStorage` key `evtin-lang`
