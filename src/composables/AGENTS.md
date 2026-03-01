<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-03-01 -->

# composables

## Purpose
Vue 3 composables providing shared reactive state and business logic. Acts as the state management layer — no Vuex/Pinia used.

## Key Files

| File | Description |
|------|-------------|
| `useItems.ts` | Central composable for all item operations — manages reactive item list, filtering, sorting, CRUD, search, and show-completed preference |
| `useItemDetail.ts` | Composable encapsulating all ItemDetail screen logic — item load/save, view/edit mode switching, photo URI caching, comment CRUD, and shared content ingestion |
| `useItems.spec.ts` | Unit tests for useItems composable |

## For AI Agents

### Working In This Directory
- State is module-level `ref()` variables shared across all component instances calling `useItems()`
- The `initialize()` function must be called once (in `App.vue`) before any other operations
- `filteredItems` is a computed that applies search text and show-completed filters, then sorts by completion status and due date
- CRUD operations update both the database and the in-memory reactive array
- `useItemDetail()` is scoped to the ItemDetail view instance — not a singleton

### Testing Requirements
- Mock `databaseService`, `notificationService`, `recurrenceService`, and `photoService` in tests
- Test filtering, sorting, and CRUD logic independently

### Common Patterns
- Singleton pattern: module-scoped `ref()` values ensure all components share the same state (`useItems`)
- Instance-scoped composable pattern: `useItemDetail` creates fresh state per call
- Returns object with both state refs and action functions
- All async operations handle errors internally and propagate via throw

## Dependencies

### Internal
- `../models/DashItem.ts` — `DashItem`, `Comment` types
- `../services/database.ts` — persistence layer
- `../services/notificationService.ts` — reminder scheduling
- `../services/recurrenceService.ts` — recurring task generation
- `../services/photoService.ts` — photo URI resolution and cleanup
- `../services/shareService.ts` — shared content ingestion (used by `useItemDetail`)

### External
- `vue` — `ref`, `computed`, `reactive`, `watch`, `onMounted`
- `vue-router` — route params and query access
- `@ionic/vue` — `useIonRouter`, `alertController`, `actionSheetController`
- `uuid` — ID generation for new items and comments

<!-- MANUAL: -->
