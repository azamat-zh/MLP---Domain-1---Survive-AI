# Documentation

Documentation for SkillCast, a Next.js POC for the Aiversecity Future-Ready Workforce challenge.

## Pages

| Page | Contents |
| --- | --- |
| [architecture.md](architecture.md) | System architecture, view model, data flow, API routes |
| [data-model.md](data-model.md) | Prisma schema, signal ingestion pipeline, matching formula, Skill Momentum Index |
| [development.md](development.md) | Conventions and patterns: imports, styling, theming, i18n, error handling |
| [verification.md](verification.md) | Testing and QA: lint, build-tooling tests, browser golden path |
| [ai-call-sites.md](ai-call-sites.md) | Where AI compute enters the app, why the forecast core stays deterministic, live signal sources |

## Related

- `README.md` (repository root) - quick start, dependencies, scripts, deployment
- `AGENTS.md` (repository root) - concise guidelines for AI assistants working in this repository
- `worklog.md` - task log with the design decisions behind the POC

## Maintenance

Docs are written in plain Markdown with no emojis. Keep pages practical: commands, file paths and exact symbols over prose. Update the relevant page when a section of the codebase it describes changes (schema, formulas, route shapes, conventions).