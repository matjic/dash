<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-03-01 -->

# src

## Purpose
Application source code for Dash, a Vue 3 + Ionic + Capacitor task management app. Contains all frontend components, business logic services, data models, routing, and theming.

## Key Files

| File | Description |
|------|-------------|
| `main.ts` | App entry point — creates Vue app, configures Ionic (forced iOS mode), mounts router, sets up notification listeners |
| `App.vue` | Root component — initializes database, shortcuts, and deep link handling on mount |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable Vue components (see `components/AGENTS.md`) |
| `composables/` | Vue 3 composables for shared state (see `composables/AGENTS.md`) |
| `models/` | TypeScript interfaces and data model definitions (see `models/AGENTS.md`) |
| `router/` | Vue Router route definitions (see `router/AGENTS.md`) |
| `services/` | Business logic modules — database, NLP, notifications, photos, sharing (see `services/AGENTS.md`) |
| `test/` | Test setup and Capacitor mocks (see `test/AGENTS.md`) |
| `theme/` | Ionic CSS variable overrides (see `theme/AGENTS.md`) |
| `utils/` | Shared pure utility functions — date formatting, string helpers, constants (see `utils/AGENTS.md`) |
| `views/` | Page-level Vue components (see `views/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Use Vue 3 Composition API with `<script setup lang="ts">`
- Use Ionic Vue components for all UI elements
- App forces iOS styling (`mode: 'ios'` in main.ts) — never override this
- No external state library — use composables in `composables/`
- Services are plain TypeScript modules exporting singleton instances or functions

### Testing Requirements
- Spec files live alongside source files (e.g., `nlpParser.spec.ts` next to `nlpParser.ts`)
- Run `bun run test:run` to execute all tests
- Test config is in `vite.config.ts` (Vitest with jsdom environment)
- Setup file at `test/setup.ts` provides Capacitor mocks

### Common Patterns
- Services export singleton class instances (e.g., `export const databaseService = new DatabaseService()`)
- Composables return reactive state + action functions from a single `use*()` function
- All dates stored as ISO strings, parsed with `new Date()`
- JSON arrays stored as stringified JSON in SQLite columns

## Dependencies

### Internal
- `ios/App/App/` — Native Swift code must stay in sync with `services/database.ts` schema

### External
- `vue` 3.x — UI framework
- `@ionic/vue` 8.x — iOS-style component library
- `@capacitor/*` 8.x — Native bridge plugins
- `chrono-node` — Natural language date parsing
- `uuid` — ID generation

<!-- MANUAL: -->
