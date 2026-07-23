# GhastMailer

A Win95-styled desktop email client built with **Tauri 2** (Rust shell) + **React 19** + **TypeScript** + **Tailwind v4**, routed with `react-router-dom` (hash router). Package manager is **pnpm**.

## Layout
- `src/` — React frontend. `pages/` are routed views, `common/` is shared UI, `lib/` is non-UI logic.
- `src/common/` is split by responsibility — **read `src/common/SKILL.md`** before adding shared UI:
  - `elements/` — generic presentational primitives (`Button`, `Input`, `Link`, badges, bevel components) with no app-specific knowledge.
  - `components/` — feature-specific composites built from elements (specific-use dialogs & panels, e.g. `accounts-settings`, `add-account-dialog`).
  - `layouts/` — structural wrappers that arrange regions of a screen (page shells, split panes, docked frames).
- `src/lib/db/` — the database layer. See `src/lib/db/SKILL.md` before touching anything data-related.
- `src-tauri/` — the Rust/Tauri shell. `migrations/` holds SQL migrations, `capabilities/` holds permission grants.

## Data & state — defaults
- **TanStack Query (`@tanstack/react-query`) is the default for all data fetching and mutations.** Reach for `useQuery`/`useMutation` rather than ad-hoc `useEffect` + `fetch`/`invoke`/`useState` data loading. The `QueryClientProvider` is mounted once in `src/main.tsx`.
- Persistent data lives in **SQLite**, accessed only through `src/lib/db/`. Components never write inline SQL. **Read `src/lib/db/SKILL.md`** for the query/mutation pattern, query-key conventions, and how to add migrations.
- Local-only UI state (open dialogs, form drafts) stays in component `useState` — don't put it in TanStack Query.

## Conventions
- Imports are relative (no path alias).
- Keep the Win95 aesthetic: reuse shared UI from `common/` (`Button`, `Dialog`, `Input`, bevel classes) instead of hand-rolling styled markup. See `src/common/SKILL.md` for which folder a new piece belongs in.

## Commands
- `pnpm tauri dev` — run the desktop app (boots Vite + Rust). Migrations apply on startup.
- `pnpm dev` — frontend only (Vite at :1420).
- `pnpm build` — typecheck (`tsc`) + Vite build.
