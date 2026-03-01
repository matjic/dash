<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# views

## Purpose
Page-level Vue components representing full screens in the app. Each view is wrapped in `IonPage` and corresponds to a route.

## Key Files

| File | Description |
|------|-------------|
| `MainTimeline.vue` | Primary screen — displays filtered/sorted task list with search bar, filter button, QuickAddBar, and swipe actions (complete, delete). Handles show-completed toggle and pull-to-refresh |
| `ItemDetail.vue` | Create/edit screen — full form for task properties (title, notes, due date, priority, tags, recurrence, reminders, photos, comments, attachments, links). Handles incoming shared content from Share Extension |

## For AI Agents

### Working In This Directory
- Every view must use `IonPage` as root element
- Views connect composables (`useItems`) to components — they orchestrate but delegate rendering
- `ItemDetail.vue` handles both create (`:id` = `new`) and edit (`:id` = UUID) modes
- `ItemDetail.vue` also processes shared content when navigated via `dash://share` deep link
- Navigation between views uses `vue-router` push/replace

### Testing Requirements
- Views are best tested via E2E tests (Playwright)
- Component-level testing can use `@vue/test-utils` with full mount

### Common Patterns
- Use `IonHeader` + `IonToolbar` + `IonContent` layout structure
- Action sheets and alerts via Ionic's `actionSheetController` and `alertController`
- Haptic feedback on meaningful interactions
- Date pickers via `@capacitor-community/date-picker`

## Dependencies

### Internal
- `../composables/useItems.ts` — all item state and CRUD
- `../components/` — QuickAddBar, ItemRow, PhotoViewer, RichText
- `../services/` — photoService, linkService, shareService, shareItemService, calendarLinkService, notificationService
- `../models/DashItem.ts` — type definitions

### External
- `@ionic/vue` — page layout and UI components
- `@capacitor/haptics` — tactile feedback
- `@capacitor-community/date-picker` — native date/time selection
- `ionicons` — icons

<!-- MANUAL: -->
