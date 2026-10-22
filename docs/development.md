# Development

## Prerequisites

- Bun (see [README.md](../README.md))
- `bun install` after cloning

## Import Aliases and Conventions

Path aliases are configured in `tsconfig.json` and `components.json`:

| Alias | Maps to | Usage |
| --- | --- | --- |
| `@/` | `./src/` | All source imports, e.g. `@/lib/types`, `@/components/skillcast/landing` |
| `@/lib/utils` | `src/lib/utils.ts` | `cn()` class merging |
| `@/components/ui` | `src/components/ui/` | shadcn/ui primitives |
| `@/hooks` | `src/hooks/` | Custom hooks |

Always use `@/` imports, never relative paths.

## Components

- **Screens**: One named React export per file in `src/components/skillcast/`. All are `'use client'`.
- **UI primitives**: shadcn/ui in `src/components/ui/`. These are Radix-based and styled with Tailwind + `cn()`.
- **New primitives**: add to `src/components/ui/` following the existing naming (`accordion.tsx`, `button.tsx`, etc.).

## Styling and Theming

- Tailwind CSS 4 with the `@tailwindcss/postcss` pipeline.
- CSS variables define the color palette in `src/app/globals.css`:
  - `:root` (light theme) and `.dark` (dark theme) blocks using `oklch()`.
  - Chart colors: `--c1` through `--c5`.
  - Radius: `--radius`.
- Dark theme is the default (see Theming below).
- Use `cn()` from `@/lib/utils` for class merging instead of raw string concatenation.
- Tailwind v4 detects content automatically; `tailwind.config.ts` exists for the v3-compatible variable declarations but is not authoritative for content paths.

### Theming (`next-themes`)

The app uses `next-themes` for theme switching:

- `src/app/layout.tsx` wraps content in `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} />`.
- `src/components/skillcast/header.tsx` has a light/dark toggle using `useTheme()` with a `mounted` hydration guard (`useSyncExternalStore` pattern matching `page.tsx`).
- `src/app/globals.css` uses the `@custom-variant dark (&:is(.dark *))` Tailwind v4 variant syntax for the `.dark` class.

## i18n Pattern

Translations use the custom `makeT(lang)` system from `src/lib/i18n.ts`:

```ts
const t = makeT(lang);          // "en", "bm", "zh", "ru"
const label = t("matching.role", { score: 85, role: "AI Engineer" });
```

- Keys use dot-notation namespacing.
- Variables use `{varName}` interpolation.
- UI components should consume translations through the `useT()` hook in `src/components/skillcast/shared.tsx`.

## Error Handling

The project follows a deterministic-fallback pattern:

- **Per-source try/catch**: signal sources (Remotive, Arbeitnow) are independently wrapped. One source failing does not affect the other.
- **Graceful degradation**: if all live sources fail, `seedSnapshots()` supplies curated fallback data. The UI receives a valid response in every case.
- **Coach fallback**: if the GLM narration call fails (network, auth, or parse error), the route returns `fallbackNarration` and the UI displays `fallback: true` with a disclosure note.
- **No throw-heavy flows**: the application avoids runtime exceptions in user-facing paths; fallbacks produce a UI response.

## Deterministic Invariants

The following published formulas are invariants. Changing them changes product guarantees and the explainability copy. Any update requires updating the in-app disclosure text and the matching algorithm description:

| Constant | Location | Value |
| --- | --- | --- |
| `FORMULA` | `src/lib/matching.ts` | 0.40 overlap, 0.30 transferable, 0.20 experience, 0.10 interest |
| `SMI_WEIGHTS` | `src/lib/momentum.ts` | 0.5 frequency, 0.3 trend, 0.2 research horizon |

## Adding a New View

1. Create `src/components/skillcast/<name>.tsx` exporting the screen component.
2. Add the view name to the `View` union type in `src/lib/store.ts`.
3. Add the import and switch case in `src/app/page.tsx`.
4. Add i18n keys to `src/lib/i18n.ts` for navigation and labels.

## Database Changes

1. Edit `prisma/schema.prisma`.
2. `bun run db:generate` to regenerate the Prisma client.
3. `bun run db:push --accept-data-loss` to apply the schema to your local database (resets data).
4. Files changed: `prisma/schema.prisma`, optionally `src/lib/db.ts`.

## Deployment

The app builds as a Next.js standalone output (`bun run build` then `bun run start`). Deployment packaging for the Linux sandbox is handled by local tooling outside the repository; `Caddyfile` (port 81 -> 3000) and `mini-services/` (standalone micro-apps) are the in-repo runtime pieces.