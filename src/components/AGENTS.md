<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# components

## Purpose
Reusable Vue 3 components used across views. Each component is a single `.vue` file using Composition API with TypeScript.

## Key Files

| File | Description |
|------|-------------|
| `QuickAddBar.vue` | Bottom-anchored input bar for natural language task capture — parses input via `nlpParser` and creates items |
| `ItemRow.vue` | Single task row in the timeline list — shows title, due date, priority indicator, completion toggle, swipe actions |
| `PhotoViewer.vue` | Swipeable photo gallery using Swiper — displays photos attached to items with full-screen viewing |
| `RichText.vue` | Renders text with auto-detected URLs as tappable links using `linkService` |
| `QuickAddBar.spec.ts` | Unit tests for QuickAddBar |
| `ItemRow.spec.ts` | Unit tests for ItemRow |

## For AI Agents

### Working In This Directory
- Every component uses `<script setup lang="ts">` with Ionic Vue components
- Components receive data via props and emit events — no direct database access
- Use Ionic components (`IonItem`, `IonLabel`, `IonButton`, etc.) for consistent iOS styling
- All components must support both light and dark modes using Ionic CSS variables

### Testing Requirements
- Spec files live alongside components (e.g., `ItemRow.spec.ts`)
- Use `@vue/test-utils` with `mount()` for component tests
- Mock Capacitor plugins via `src/test/mocks/capacitor.ts`

### Common Patterns
- Props typed with TypeScript interfaces from `models/DashItem.ts`
- Haptic feedback via `@capacitor/haptics` on user interactions
- Swipe actions on list items use `IonItemSliding` + `IonItemOptions`

## Dependencies

### Internal
- `../models/DashItem.ts` — `DashItem`, `Priority`, `isOverdue()` types/functions
- `../services/nlpParser.ts` — used by QuickAddBar for input parsing
- `../services/linkService.ts` — used by RichText for URL detection
- `../composables/useItems.ts` — item CRUD operations

### External
- `@ionic/vue` — UI components
- `swiper` — photo carousel in PhotoViewer
- `@capacitor/haptics` — tactile feedback

<!-- MANUAL: -->
