# EVTIN Studio — handoff for the next Claude Code session

_Last updated: 2026-10-05 (session 2). Working branch: `claude/studio-audit-fixes` (not merged into `main` yet, no PR opened)._

## What the project is
EVTIN Studio is Ivan Evtin's independent web design / development studio. The site is a sales tool for international cold traffic: English by default, Russian via an RU/EN toggle. Positioning: "independent studio with agency-level thinking, without the agency overhead". It shows one real project (Ivan's musician site) plus three clearly labelled concept/demo projects. No fake clients, testimonials or metrics, ever.

The studio must not look like the musician site (https://evtinivan.netlify.app/). Its own visual system: plum `#21172b`, paper `#f5efdf`, lime `#b9ff73`, coral `#ff6d61`; Manrope plus DM Mono.

## Fixed facts (do not change)
- Email: `evtin6@gmail.com` (mailto everywhere). Never Mail.ru, never "Yachtin6".
- Formspree: `https://formspree.io/f/mnpagjqg`, subject `New enquiry — EVTIN Studio`.
- Instagram https://www.instagram.com/evtinivan · Telegram https://t.me/video_s_meropriyatiy
- Language key in localStorage: `evtin-lang` (shared by the home page and the concept pages).
- Domain (confirmed by Ivan, session 2): https://evtinstudio.netlify.app/ — used in canonical, OG, JSON-LD, robots.txt and sitemap.xml.
- Deadline (Ivan, session 2): test launch by **2026-10-08**.
- Ivan's personal/musician brand profile (archetypes, anchors, palette, tone): `docs/ivan-profile.md`. Read it before touching About, the musician case or copy tone.
- The sandbox proxy blocks `*.netlify.app`, so the live site cannot be fetched from here.

## Repo layout (static site, no build)
- `index.html`, `styles.css`, `script.js`: home page (Hero → Approach → Work → What I do → How it works → Price & scope → About → FAQ → Contact, numbered 01–09)
- `concept-noir.html`, `concept-0642.html`, `concept-atelier07.html`: three concepts. Each one keeps its own visual system in an inline `<style>`.
- `concept.css`: shared concept chrome (top bar with the CONCEPT/DEMO tag, case notes, footer)
- `concept.js`: shared i18n for the concept pages. It reads `window.CONCEPT_I18N` and applies `data-i18n` via innerHTML.
- `fonts/`: self-hosted woff2 (latin + cyrillic) plus `fonts/fonts.css`, shared by all pages. DM Mono has no Cyrillic, so RU mono labels fall back to the system monospace (same as before).
- `robots.txt`, `sitemap.xml` (home only; concepts are `noindex`), `assets/og.png` (1200×630)
- `netlify.toml` (publish ".", long cache on `/fonts/*`), `assets/` (portraits ivan-01/02/03.webp, og.png)
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
5. Home page additions (session 2):
   - "How it works": Brief 1–2 days → Structure 3–5 days → Design ~1 week → Build & launch ~1 week; typical total 2–3 weeks landing / 4–6 weeks full site. **Timelines are my proposal; Ivan to confirm.**
   - "Price & scope": landing from €300 / 30 000 ₽, full site from €500 / 50 000 ₽ (prices updated by Ivan after launch), "not included" list; nav link "Pricing".
   - FAQ (`<details>`, no JS): timeline, revisions, domain/hosting, support.
   - Work card copy for the three concepts updated; full EN/RU for everything.
6. SEO: robots.txt, sitemap.xml, canonical, OG/Twitter tags + og.png; README explains why there is no hreflang (RU is a same-URL toggle).
7. Fonts self-hosted (Google Fonts was reachable this session); favicon added to concept pages.
8. QA again at 375/768/1440, EN+RU, all pages: no horizontal overflow, no JS errors, no external requests; only 404 is the missing portrait.

9. ECC audit pass (session 2): Lighthouse CLI plus the ECC agents a11y-architect, seo-specialist, code-reviewer and security-reviewer. The ECC chrome-devtools MCP cannot start Chrome in this container (runs as root, no /opt/google/chrome), so Lighthouse runs from the CLI against /opt/pw-browsers chromium. Fixed:
   - a11y: kicker, 06:42 and Atelier contrast; dark focus ring on light sections; burger focus management; scroll-padding under sticky bars; language button names ("RU — Русская версия"); duplicate mock links removed from tab order; FAQ marker excluded from the accessible name; NOIR ticker pause button, size-state fill, product-labelled size groups, announced toast; Atelier floor plan focus ring, aria-pressed, translated room names; aria-atomic on live regions; submit uses aria-disabled.
   - Bugs: 06:42 status follows St. Petersburg time; NOIR mobile hero no longer clipped; no hole when filtering the drop; ticker gap on wide screens; form status retranslates on language switch; 15s fetch timeout; maxlength on fields.
   - SEO: keyword title/description (EN+RU), JSON-LD (WebSite, Person, ProfessionalService with offers in EUR and RUB), og:site_name/locale, twitter:image, kicker "EVTIN STUDIO — WEB DESIGN".
   - Security: CSP and other headers; inline scripts moved to files; repo-only files return 404.
   - Fonts: Oswald (cyrillic) behind Anton, Manrope behind Instrument Sans, Fraunces 400; above-the-fold fonts preloaded (CLS on NOIR 0.205 → 0, Atelier 0.136 → 0.017).
   - Result: Lighthouse accessibility 100 on all 4 pages; best practices 100 on concepts, 96 on home only because of the missing portrait; SEO 100 on home (concepts are noindex by design).

10. Copy & logic pass from Ivan's brief (session 2, after launch):
   - Hero "Websites / that sound / like you." (RU "Сайты, / которые звучат / как вы."); musician card = press kit + booking; Ivan's own texts for work intro and the three concept cards.
   - Footer mail link labelled "Gmail" in both languages.
   - 06:42: live clock, open status and timeline all use the visitor's local time (Ivan chose this); hours 07:30–19:00; coffee card uses Region / Process: Washed / Roasted / Best for / Tasting notes.
   - Prices carry both values (`data-eur` / `data-rub`), formatted by `concept.js` on language switch: RU → RUB, EN → EUR. NOIR RUB = EUR×100 (Ivan's example). 06:42 EUR menu prices are my proposal.
   - Home pricing: €300 / 30 000 ₽ landing, €500 / 50 000 ₽ full site (data-eur/data-rub, formatted in script.js).
   - 06:42 facts: "St. Petersburg. A street you won't find on the map." / "We roast on Mondays. By Friday, it's whatever's left." (roast date shows the latest Monday); calculator unit "мл" in RU.
   - Tags: "Concept 01/02/03" (RU "Концепт") on home cards and concept bars. CTA "View concept" and disclaimer wording unchanged.

## Next steps
1. Optionally replace the drawn mock of the musician project with a real screenshot.
2. Portraits added (session 2): `assets/ivan-03.webp` in the hero; `ivan-01.webp` and `ivan-02.webp` are spare shots from the same session (could go into About instead of the IE circle if Ivan wants).
3. After Ivan approves: open a PR into `main` → Netlify deploy → live QA (form, links, language, mobile).
4. Formspree dashboard (Ivan): turn on spam filtering/CAPTCHA and restrict the form to the final domain.
5. Remaining low-priority a11y: some English-only aria-labels and decorative strings in RU mode (nav 'Main', burger 'Menu', NOIR ticker, 06:42 menu item names); no visible 'required' cue on the form.
6. Later: cookie-less analytics (Plausible/Umami) with a form-submit goal; outreach plan.

## Open questions for Ivan
- Upload `assets/ivan-03.webp` (and `ivan-01.webp` if wanted).
- Has the live site changed since the dossier build? If so, send the current files.

## Working rules
- Ivan writes in Russian; answer in Russian.
- Multi-model workflow: ChatGPT coordinates, Grok critiques, Kimi builds, Claude Code audits and implements in the real code.
- Verify in the browser before calling anything done. Do not create PRs unless asked. Do not restart the strategy; preserve good decisions and change what the evidence says is weak.
