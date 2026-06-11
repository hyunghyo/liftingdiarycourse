# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project docs

Before writing or modifying any code, ALWAYS check the `/docs` directory for a relevant doc (e.g. `docs/ui.md` for UI/styling work) and follow its guidance.

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint (Next.js core-web-vitals + TypeScript rules)
```

No test runner is configured.

## Stack

- **Next.js 16.2.7** with the App Router (`src/app/`)
- **React 19.2.4**
- **Tailwind CSS v4** (PostCSS plugin via `@tailwindcss/postcss`)
- **TypeScript 5** in strict mode; path alias `@/*` → `src/*`

## Architecture

This is a fresh Next.js App Router project. All routes live under `src/app/`. The root layout (`src/app/layout.tsx`) loads the Geist font family via `next/font/google` and wraps all pages in a full-height flex column body. Styling is utility-first with Tailwind; no CSS Modules or styled-components are used.

## Next.js version note

This project uses Next.js 16, which has breaking changes from earlier versions. Before writing Next.js-specific code, consult the bundled docs at `node_modules/next/dist/docs/` — especially the App Router section (`01-app/`).
