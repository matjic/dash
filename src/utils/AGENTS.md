<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-01 | Updated: 2026-03-01 -->

# utils

## Purpose
Shared pure utility functions and constants used across the app. No side effects, no service imports — safe to import anywhere.

## Key Files

| File | Description |
|------|-------------|
| `date.ts` | Date formatting utilities — `formatDate`, `formatRelativeDate`, `formatCommentDate`, `formatDateNice`, `formatDateShort` |
| `string.ts` | String helpers — `capitalizeFirst` |
| `constants.ts` | Shared constants — `MS_PER_DAY` (milliseconds in one day) |
| `date.spec.ts` | Unit tests for date formatting functions |
| `string.spec.ts` | Unit tests for string utilities |
| `constants.spec.ts` | Unit tests for constants |

## For AI Agents

### Working In This Directory
- All exports must be pure functions or plain constants — no class instances, no reactive state
- No imports from `../services/`, `../composables/`, or `../models/` — utils sit below those layers
- Prefer adding to an existing file over creating a new one unless the domain is clearly distinct

### Testing Requirements
- Every exported function and constant should have a corresponding test
- Tests live alongside source files (e.g., `date.spec.ts` next to `date.ts`)
- Run `bun run test:run` to execute

## Dependencies

### Internal
- None

### External
- None (pure TypeScript)

<!-- MANUAL: -->
