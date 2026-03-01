<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# router

## Purpose
Vue Router configuration using Ionic's `createRouter` with web history mode.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Route definitions — `/` redirects to `/timeline`, `/timeline` loads `MainTimeline`, `/item/:id?` lazy-loads `ItemDetail` |

## For AI Agents

### Working In This Directory
- Uses `@ionic/vue-router`'s `createRouter` (not plain `vue-router`)
- Only two real routes: `Timeline` and `ItemDetail`
- `ItemDetail` uses optional `:id?` param — `new` for creation, UUID for editing
- Deep links (`dash://add-task`, `dash://timeline`, `dash://share`) are handled in `services/shortcutService.ts`, not here

### Testing Requirements
- Route changes are typically tested via E2E tests rather than unit tests

## Dependencies

### Internal
- `../views/MainTimeline.vue` — eagerly loaded
- `../views/ItemDetail.vue` — lazy loaded via dynamic import

### External
- `@ionic/vue-router` — Ionic-aware router

<!-- MANUAL: -->
