<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# composables

## Purpose
Vue 3 composables providing shared reactive state and business logic. Acts as the state management layer — no Vuex/Pinia used.

## Key Files

| File | Description |
|------|-------------|
| `useItems.ts` | Central composable for all item operations — manages reactive item list, filtering, sorting, CRUD, search, and show-completed preference |
| `useItems.spec.ts` | Unit tests for useItems composable |

## For AI Agents

### Working In This Directory
- State is module-level `ref()` variables shared across all component instances calling `useItems()`
- The `initialize()` function must be called once (in `App.vue`) before any other operations
- `filteredItems` is a computed that applies search text and show-completed filters, then sorts by completion status and due date
- CRUD operations update both the database and the in-memory reactive array

### Testing Requirements
- Mock `databaseService`, `notificationService`, `recurrenceService`, and `photoService` in tests
- Test filtering, sorting, and CRUD logic independently

### Common Patterns
- Singleton pattern: module-scoped `ref()` values ensure all components share the same state
- Returns object with both state refs and action functions
- All async operations handle errors internally and propagate via throw

## Dependencies

### Internal
- `../models/DashItem.ts` — `DashItem` type
- `../services/database.ts` — persistence layer
- `../services/notificationService.ts` — reminder scheduling
- `../services/recurrenceService.ts` — recurring task generation
- `../services/photoService.ts` — photo cleanup on delete

### External
- `vue` — `ref`, `computed` reactivity
- `uuid` — ID generation for new items

<!-- MANUAL: -->
