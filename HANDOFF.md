# EVTIN Studio — handoff for the next Claude Code session

_Last updated: 2026-10-05. Working branch: `claude/studio-audit-fixes` (not merged into `main` yet, no PR opened)._

## What the project is
EVTIN Studio is Ivan Evtin's independent web design / development studio. The site is a sales tool for international cold traffic: English by default, Russian via an RU/EN toggle. Positioning: "independent studio with agency-level thinking, without the agency overhead". It shows one real project (Ivan's musician site) plus three clearly labelled concept/demo projects. No fake clients, testimonials or metrics, ever.

The studio must not look like the musician site (https://evtinivan.netlify.app/). Its own visual system: plum `#21172b`, paper `#f5efdf`, lime `#b9ff73`, coral `#ff6d61`; Manrope plus DM Mono.

## Fixed facts (do not change)
- Email: `evtin6@gmail.com` (mailto everywhere). Never Mail.ru, never "Yachtin6".
- Formspree: `https://formspree.io/f/mnpagjqg`, subject `New enquiry — EVTIN Studio`.
- Instagram https://www.instagram.com/evtinivan · Telegram https://t.me/video_s_meropriyatiy
- Language key in localStorage: `evtin-lang` (shared by the home page and the concept pages).
- Live site (per Ivan): https://evtstudio.netlify.app/ (the old dossier says `evtinstudio`; **not confirmed yet**). The sandbox proxy blocks `*.netlify.app`, so the live site cannot be fetched from here.

## Repo layout (static site, no build)
- `index.html`, `styles.css`, `script.js`: home page (Hero → Approach → Work → What I do → About → Contact)
- `concept-noir.html`, `concept-0642.html`, `concept-atelier07.html`: three concepts. Each one keeps its own visual system in an inline `<style>`.
- `concept.css`: shared concept chrome (top bar with the CONCEPT/DEMO tag, case notes, footer)
- `concept.js`: shared i18n for the concept pages. It reads `window.CONCEPT_I18N` and applies `data-i18n` via innerHTML.
- `netlify.toml` (publish "."), `assets/` (**empty: `ivan-03.webp` portrait is missing; Ivan must upload it**)
- `.claude/settings.json` enables the ECC plugin (`ecc@ecc`, affaan-m/everything-claude-code)

## Done so far
1. Removed the stray Next.js generator script `site` (it was unrelated to the project).
2. Restored the static site from the dossier and fixed:
   - The RU/EN toggle wiped the form inputs; translations are now on `<span>`s inside the labels.
   - The form submits via fetch with an inline success/error message, a honeypot `_gotcha` and a plain-POST fallback.
   - Burger menu on ≤850px; the RU/EN toggle stays visible outside the menu.
   - Focus-visible styles, contrast, `prefers-reduced-motion`, `aria-hidden` on decor.
   - Translated `<title>` and meta description, OG tags, inline SVG favicon.
   - "RUSSIA · 2026" changed to "WORLDWIDE · 2026"; hero counter changed to 01/06.
3. Rebuilt the concepts as distinct mini-projects (previously they were one template):
   - NOIR: black/bone/red, Anton; filterable drop, size picker, demo bag.
   - 06:42: paper/espresso/terracotta, Fraunces; live open status, timeline highlighting the current hour, menu first, brew calculator.
   - ATELIER 07: stone/olive, Cormorant; chapters with a sticky index, clickable floor plan, material library, process steps.
   - Each has "Case notes" (brief / decisions / what you'd get) and full EN/RU.
4. QA: Playwright with `/opt/pw-browsers/chromium` at 375/768/1440, all 4 pages. No horizontal overflow, no missing RU keys, no JS errors; interactions verified. Google Fonts are blocked in the sandbox, so screenshots use fallback fonts.

## Next steps (agreed plan)
1. Home page additions:
   - "How it works": 3–4 steps with timelines.
   - "Price & scope", open prices: landing page from €500, full site from €900+. €500 includes 1 page, 1 goal, up to 4 sections, client copy/images, 2 revision rounds, responsive, launch on client domain. Excludes extra pages, CMS, e-commerce, photography, copywriting from scratch, complex animation, ongoing support.
   - Short FAQ: timeline, revisions, domain/hosting, support.
   - Optionally replace the drawn mock of the musician project with a real screenshot.
2. Update the home Work card copy to reflect the richer concepts.
3. SEO basics: `robots.txt`, `sitemap.xml`, `hreflang` note, OG image.
4. Self-host the fonts (performance/privacy) if network access allows.
5. After Ivan approves: open a PR into `main` → Netlify deploy → live QA (form, links, language, mobile).
6. Later: cookie-less analytics (Plausible/Umami) with a form-submit goal; outreach plan.

## Open questions for Ivan
- Which domain is correct: `evtstudio` or `evtinstudio`?
- Upload `assets/ivan-03.webp` (and `ivan-01.webp` if wanted).
- Has the live site changed since the dossier build? If so, send the current files.

## Working rules
- Ivan writes in Russian; answer in Russian.
- Multi-model workflow: ChatGPT coordinates, Grok critiques, Kimi builds, Claude Code audits and implements in the real code.
- Verify in the browser before calling anything done. Do not create PRs unless asked. Do not restart the strategy; preserve good decisions and change what the evidence says is weak.
