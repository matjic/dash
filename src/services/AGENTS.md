<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# services

## Purpose
Business logic modules encapsulating all non-UI functionality. Each service is a plain TypeScript module — most export singleton class instances, some export pure functions.

## Key Files

| File | Description |
|------|-------------|
| `database.ts` | SQLite persistence via `@capacitor-community/sqlite` — `DatabaseService` class handles CRUD, schema creation, migrations, preferences, and demo data seeding |
| `database.schema.ts` | Canonical schema definition shared with iOS Swift code — column types, defaults, and Siri task defaults |
| `nlpParser.ts` | Natural language input parsing — extracts dates (via `chrono-node`), priority keywords, and recurrence patterns from quick-capture text |
| `notificationService.ts` | Local notification scheduling/canceling via `@capacitor/local-notifications` — manages reminders with stable hash-based IDs |
| `notificationListeners.ts` | Notification tap handlers — navigates to item detail when user taps a notification |
| `recurrenceService.ts` | Generates future recurring task instances (10 occurrences) from a recurring item |
| `photoService.ts` | Photo capture, gallery pick, filesystem storage, deletion, and native sharing via `@capacitor/camera` and `@capacitor/filesystem` |
| `linkService.ts` | URL detection in text, parsing text into link segments, opening URLs in in-app browser via `@capacitor/browser` |
| `shareService.ts` | Processes incoming shared content from iOS Share Extension — reads from staging area, copies files/images, generates suggested titles |
| `shareItemService.ts` | Outbound sharing — formats `DashItem` as plain text or PDF for the native share sheet |
| `pdfService.ts` | Capacitor plugin bridge for native iOS PDF generation from HTML |
| `calendarLinkService.ts` | Generates Google Calendar "Add Event" URLs from task due dates |
| `shortcutService.ts` | Home Screen Quick Actions (3D Touch) and deep link (`dash://`) handling for Siri intents and Share Extension |

## Spec Files

| File | Tests |
|------|-------|
| `nlpParser.spec.ts` | Date extraction, priority keywords, recurrence patterns |
| `notificationService.spec.ts` | Reminder scheduling, cancellation, ID hashing |
| `recurrenceService.spec.ts` | Recurring task generation for daily/weekly/monthly rules |
| `linkService.spec.ts` | URL parsing, extraction, text segmentation |
| `database.sync.spec.ts` | Schema sync validation between TypeScript and Swift |

## For AI Agents

### Working In This Directory
- Services are singletons — instantiated at module level and exported (e.g., `export const databaseService = new DatabaseService()`)
- Pure utility services (`linkService`, `calendarLinkService`, `nlpParser`) export functions instead
- Database schema changes require updating THREE places: `database.ts`, `database.schema.ts`, and `ios/App/App/DashDatabase.swift`
- Capacitor plugins only work on native platforms — guard with `Capacitor.isNativePlatform()` or `Capacitor.getPlatform()`

### Testing Requirements
- Each service with logic should have a corresponding `.spec.ts` file
- Mock Capacitor plugins in tests (see `../test/mocks/capacitor.ts`)
- Run `bun run test:run` to execute all service tests

### Common Patterns
- Class-based services for stateful modules (database, notifications, photos)
- Function exports for stateless utilities (link parsing, NLP, calendar links)
- Error handling: catch and log errors, re-throw for callers to handle
- All dates as ISO 8601 strings

## Dependencies

### Internal
- `../models/DashItem.ts` — `DashItem`, `Priority`, `RecurrenceRule`, `Attachment` types

### External
- `@capacitor-community/sqlite` — SQLite database
- `@capacitor/local-notifications` — reminder notifications
- `@capacitor/camera` — photo capture
- `@capacitor/filesystem` — file storage
- `@capacitor/browser` — in-app browser for links
- `@capacitor/share` — native share sheet
- `@capacitor/haptics` — tactile feedback
- `@capawesome/capacitor-app-shortcuts` — Home Screen Quick Actions
- `chrono-node` — natural language date parsing
- `uuid` — unique ID generation

<!-- MANUAL: -->
