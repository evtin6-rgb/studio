# CLAUDE.md

## Project

Evtin Studio website: Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind CSS, framer-motion.

The `site` file in the repo root is a bash bootstrap script that generates the Next.js project
(`package.json`, `app/`, `components/`, `hooks/`, `lib/`, `types/`). Edit it as a script, and keep
the heredoc contents valid TypeScript/TSX.

Commands (after the project is generated): `npm run dev`, `npm run build`, `npm run lint`.

## ECC (everything-claude-code)

The `ecc@ecc` plugin is enabled in `.claude/settings.json`. Rule packs live in `.claude/rules/ecc/`
(`common` always loads; `typescript`, `react`, `web` load for matching files).

Use ECC proactively, without waiting to be asked:

- **Before non-trivial work** (new feature, multi-file change): plan with `ecc:planner`;
  for structural decisions consult `ecc:architect`.
- **While writing code**: follow `ecc:tdd-workflow` where tests are practical; consult
  `ecc:frontend-patterns`, `ecc:react-patterns`, `ecc:nextjs-turbopack`, `ecc:frontend-design-direction`
  skills for the relevant area.
- **After any code change**: review with `ecc:code-reviewer`, plus `ecc:react-reviewer` /
  `ecc:typescript-reviewer` for `.tsx`/`.ts` changes. Fix CRITICAL and HIGH findings before committing.
- **Forms, API routes (`app/api/contact`), user input**: run `ecc:security-reviewer`.
- **Build or type errors**: use `ecc:react-build-resolver` / `ecc:build-error-resolver`.
- **UI work**: check accessibility with `ecc:a11y-architect`; SEO with `ecc:seo-specialist`;
  performance with `ecc:performance-optimizer`.
- **Library/API questions**: use `ecc:docs-lookup` instead of answering from memory.

Run independent reviewers in parallel. Respect ECC hooks (e.g. GateGuard): answer what they ask,
don't bypass them.
