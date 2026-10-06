# Инструкция для Claude — EVTIN Studio

## Кто я и как общаться
- Я Иван Евтин, веду независимую веб-студию EVTIN Studio (дизайн и разработка сайтов).
- Пиши мне по-русски: коротко, по делу, без воды. Сам сайт по умолчанию на английском, русский включается переключателем RU/EN.
- Я работаю с несколькими моделями: ChatGPT координирует, Grok критикует, Kimi пишет черновики, а ты (Claude Code) проверяешь и вносишь правки в настоящий код. Не начинай стратегию заново: сохраняй удачные решения и меняй то, что слабо по фактам.

## Проект
- Репозиторий `evtin6-rgb/studio`: статический двуязычный сайт без сборки (HTML/CSS/JS), деплой на Netlify. Домен: https://evtinstudio.netlify.app/
- Файлы: `index.html` / `styles.css` / `script.js` — главная; `concept-noir`, `concept-0642`, `concept-atelier07` (.html + .i18n.js + .js) — три концепта; общие `concept.css` / `concept.js`; шрифты лежат локально в `fonts/`; заголовки безопасности и CSP — в `netlify.toml`.
- Перед работой прочитай `HANDOFF.md` и `README.md`, а в конце сессии обнови `HANDOFF.md` (что сделано, следующие шаги, открытые вопросы).

## Неизменные факты
- Email: evtin6@gmail.com (mailto везде). Никакого Mail.ru.
- Форма: Formspree `https://formspree.io/f/mnpagjqg`, тема «New enquiry — EVTIN Studio».
- Instagram: instagram.com/evtinivan · Telegram: t.me/video_s_meropriyatiy
- Язык хранится в localStorage под ключом `evtin-lang`.
- Цены: лендинг от €500, полный сайт от €900+. Сроки (2–3 недели лендинг, 4–6 недель сайт) — моё предложение, их ещё надо подтвердить.

## Позиционирование и контент
- Сайт продаёт услуги иностранным клиентам с холодного трафика. Формула: «независимая студия с агентским мышлением, без агентских накладных расходов».
- Реальный проект один (сайт музыканта evtinivan.netlify.app), плюс три концепта с явной пометкой CONCEPT/DEMO.
- НИКОГДА не выдумывай клиентов, отзывы, цифры и кейсы.
- Своя визуальная система, не похожая на сайт музыканта: plum #21172b, paper #f5efdf, lime #b9ff73, coral #ff6d61; шрифты Manrope + DM Mono. У каждого концепта свой отдельный стиль.

## Правила работы с кодом
- Каждый текст делай сразу на EN и RU (data-i18n), не теряя ключи.
- Без inline-скриптов (CSP). Новый внешний скрипт, шрифт или эндпоинт — сначала добавь его в CSP в `netlify.toml`.
- Доступность (WCAG AA, фокус, контраст, reduced-motion), SEO (title/description, OG, JSON-LD, sitemap) и мобильная вёрстка обязательны.
- Прежде чем говорить «готово», проверь в браузере: Playwright с `/opt/pw-browsers/chromium`, ширины 375/768/1440, EN и RU, без горизонтального скролла и ошибок JS. Lighthouse запускай из CLI.
- После изменений прогоняй ревьюеров ECC (code-reviewer, a11y-architect, seo-specialist, security-reviewer — для формы) и исправляй CRITICAL/HIGH.
- Коммиты делай в формате conventional commits. PR не создавай без моей просьбы. В main напрямую не пушь.
- Если чего-то не знаешь (фото, тексты, решения), спроси меня. Не придумывай.

## Текущие задачи
- Тестовый запуск: до 08.10.2026.
- Дальше: PR в main → деплой → живая проверка (форма, ссылки, язык, мобильная версия); спам-фильтр в Formspree; аналитика без cookies (Plausible/Umami); план outreach.

## ECC (everything-claude-code)
- Плагин `ecc@ecc` включён в `.claude/settings.json`, наборы правил лежат в `.claude/rules/ecc/` (`common` грузится всегда, `web` — для файлов сайта).
- Используй ECC сам, без напоминаний: `ecc:planner` для многофайловых задач; после правок `ecc:code-reviewer`, плюс `ecc:a11y-architect`, `ecc:seo-specialist`, `ecc:performance-optimizer` для UI и `ecc:security-reviewer` для формы и `netlify.toml`. Независимых ревьюеров запускай параллельно.
- Хуки ECC (например, GateGuard) не обходи: отвечай на их вопросы.
- chrome-devtools MCP в контейнере не запускается, вместо него Playwright и Lighthouse CLI на `/opt/pw-browsers/chromium`.
