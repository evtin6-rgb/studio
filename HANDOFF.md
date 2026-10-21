# EVTIN Studio — handoff for the next Claude Code session

_Last updated: 2026-10-21 (night pass 2; earlier header said 2026-10-05). Working branch: `claude/studio-audit-fixes` (not merged into `main` yet, no PR opened)._

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

## Musician socials (context, session 3, 2026-10-07)
- Instagram: main **@evtinivan** (id 17841411995686660), second **@evtinmusic** (id 17841430879062343). Both, plus TikTok "Ivan Evtin | Музыкант | Питер", are connected through the **Windsor.ai** connector (stats + publishing). Publish or reply to comments only after Ivan's explicit "yes".
- Telegram, both current: **@wwwwhhhaat** = Ivan's own channel, the pinned post has all info; **t.me/video_s_meropriyatiy** = video channel.
- Ivan is in **Vladivostok until 2026-10-20** (calendar time zone Vladivostok is correct for now).
- Instagram audit (30 days to 2026-10-06): 160 836 views, 79% from two collab reels owned by **ТЦ «Море»** and the brand **«Хозяин Барин»** ("спеть с артистом в ТЦ" / "первый раз спеть на публику"); only ~35 new followers. Own reels: 300–600 views; best retention when Ivan is in frame talking or playing live (10–12 s avg watch); ads and announcements are skipped 72–78% of the time.
- Ivan's formats (his words, 2026-10-07): (1) **music performances in public places that boost reach for brands** (main); (2) **events**: ideally private and large corporate events, events for well-known people; (3) **teaching piano and vocals**, sign-up via Telegram DM **@SPB_Ivan_Evtin**. Audience: not only Russian-speaking, so bio and captions go EN + RU.
- «Спой со мной» is **a one-episode test, not the main format**; Ivan switches to it only if the video takes off. Workflow: Ivan shoots, Claude edits with ffmpeg; publishing via Windsor needs a public video URL, otherwise Ivan posts the file himself. Bio is changed by Ivan in the app (the API cannot).

## Repo layout (static site, no build)
- `index.html`, `styles.css`, `script.js`: home page (Intro → What I've made [real case + three concepts as a list] → What it costs + How we'll work → About → FAQ → Contact). Rebuilt 2026-10-21, see "Night pass 2".
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

## Claude mod: process-spinner (session 2026-10-14)
- `.claude/plugins/process-spinner/` — Claude Code mod: animated band above the prompt (plus the status line) with the current action and a timer (`⠹ Читаю: index.html · 7s`, then `✓ Готово за 38s · инструментов: 9`). v0.2.0: Ivan did not see the status-line version, so it moved to the `AbovePrompt` band. The band is drawn only on terminal and desktop surfaces; the mobile app does not draw it (checked: `$.session.surfaces()` is empty from the phone). v0.4.0: Clawd, the pixel octopus from the Claude Code welcome screen (`▐▛███▜▌`), in the band (pixel SVG on desktop, the block characters in the terminal; legs step, eyes blink) and a phone push via the `PushNotification` tool when a turn takes 60 s or more (`🐙 Claude закончил за 2 мин 5 с · инструментов: 7`).
- Registered via the repo marketplace `.claude-plugin/marketplace.json` (name `evtin`) and enabled in `.claude/settings.json` as `process-spinner@evtin`; the marketplace is fetched from GitHub `evtin6-rgb/studio` default branch, so it works in new sessions only after this branch is merged into `main`.
- `/.claude-plugin/*` is blocked in `netlify.toml` like `/.claude/*`.
- Check: `claude plugin validate .claude/plugins/process-spinner` and `claude plugin test .claude/plugins/process-spinner`.

## Night pass (2026-10-19, Ivan asleep, full autonomy + merge rights)
- Copy rewritten on all four pages in human voice: formal «вы» everywhere in RU, no AI tells (stacked dashes, «не X, а Y», slogan triads), facts only from CLAUDE.md/profile. Ivan's own lines kept verbatim (hero, work.intro, concept cards, «Всё гениальное — просто», hours).
- Every visible UI label now translates (section numbers, hero strips, caption, footer, NOIR ticker/cover, ATELIER units/durations). aria-label/alt translate via `data-i18n-aria` / `data-i18n-alt` (script.js and concept.js).
- Proofreader agent fixes: 06:42 roasts daily (roast date = yesterday, new coffee on Mondays); NOIR line «Двенадцать вещей. Тринадцатой не будет.» (it has seasons); ATELIER process durations fit its projects; «Копчёный дуб» (smoked oak); «Как я работаю» (one-person studio); hero strip «Петербург · удалённо».
- Musician card: real screenshot `assets/case-musician.webp`, rendered locally from repo `evtin6-rgb/evtin-studio-` (the evtinivan site; the sandbox can't reach *.netlify.app). Re-shoot it the same way if that site changes.
- About: `ivan-02.webp` in the circle instead of «IE».
- a11y: ticker facts duplicated in an sr-only list, «View concept» links named with the project title, lang on concept toggles.
- Checks: Playwright 5 pages × 320/375/768/1440 × EN/RU with production CSP, clean; Lighthouse a11y/best-practices 100 everywhere, home SEO 100 (concepts noindex by design); ECC code-reviewer approve; ECC a11y no AA failures.
- Chrome: neither the Claude-in-Chrome extension nor chrome-devtools MCP is reachable from this cloud container, so the live site can't be opened from here. Live checks stay with Ivan (checklist in the morning report).

## Night pass 2 (2026-10-21): homepage rebuilt to look hand-made, not AI-made
Ivan's brief: «пересобрать мой сайт, чтобы он выглядел как мой сайт, а не как сайт, сделанный ИИ; все формулировки живыми, как будто я сам обращаюсь к клиенту». Chrome on Ivan's laptop is not reachable from the cloud container, so research was done with web search (sources: capitalandcompute.net/blog/fix-ai-slop-design, github.com/funboy322/avoid-ai-design, 925studios.co/blog/ai-slop-design-tells, Ильяхов «Пиши, сокращай»; personal-site references: frankchimero.com, craigmod.com, sive.rs/now, ilyabirman.ru).
- Removed AI/template tells: numbered mono eyebrows («/ 02 — ПОДХОД»), all-caps micro labels, orbiting text, blobs, grain, giant tight-tracked `<br>` headings, colour-block card grids, slogan headings («Без пакетов с подвохом», «Четыре шага. Без чёрного ящика»).
- New layout: personal letter-like intro (dateline, Ivan's own hero line with one hand-drawn coral underline, two plain paragraphs, price line), real photo with a caption and a drawn arrow; real case shown as desktop + phone screenshots (`assets/case-musician-phone.webp`); concepts as a list «И три выдуманных заказчика» with real screenshots (`assets/concept-*.webp`); prices as a price list with dotted leaders; process as a plain numbered list; About with a «Сейчас:» line; letter-style contact with a small avatar (`assets/ivan-01-avatar.webp`). 404 rewritten in the same voice. New OG image (`assets/og.png`) with the hero line.
- Palette and fonts kept (plum/paper/lime/coral, Manrope); DM Mono is no longer used on the home page. Lime is used as a highlighter, coral only for the hand-drawn marks; coral-ink #b23a2e for link underlines (contrast).
- Copy: first person, «вы», plain words; Ivan's own lines kept verbatim (hero, concept descriptions, «Сайты делаю так же, как песни…»). Facts only from CLAUDE.md/profile/musician site (Avito reviews are on evtinivan.netlify.app).
- Checks: Playwright 5 pages × 320/375/768/1440 × EN/RU with production CSP, no overflow/JS errors; Lighthouse home mobile 99/100/100/100, desktop 100/100/100/100; ECC code-reviewer (no critical), ECC a11y (fixed: link underline contrast, input borders, FAQ +/– read aloud, skip target, list roles, required-fields note, menu reset on resize); copy proofreader fixes applied.
- Merged? No: left as a PR with a Netlify preview for Ivan to look at first.

## Next steps
0. Ivan: look at the PR preview of the rebuilt homepage and say «сливай» or what to change. Best upgrade next: real photos from gigs (at the piano, white glasses, red jacket) to replace the studio portraits.
1. Ivan: live check on the phone after deploy (form, RU/EN, prices ₽/€, 06:42 clock).
2. Ivan: Formspree dashboard — spam filter/CAPTCHA, restrict to evtinstudio.netlify.app.
3. Client search plan: see the Google Doc linked in the night report (or docs/client-plan.md).
4. Later: cookie-less analytics (Plausible/Umami) with a form-submit goal (add host to CSP); own domain.
5. Timelines (2–3 / 4–6 weeks) still unconfirmed by Ivan.

## Open questions for Ivan
- Timelines on the site: confirm or give your own.

## Working rules
- Ivan writes in Russian; answer in Russian.
- Multi-model workflow: ChatGPT coordinates, Grok critiques, Kimi builds, Claude Code audits and implements in the real code.
- Verify in the browser before calling anything done. Do not create PRs unless asked. Do not restart the strategy; preserve good decisions and change what the evidence says is weak.
