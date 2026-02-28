<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# models

## Purpose
TypeScript type definitions and data model interfaces for the Dash application. Defines the core `DashItem` entity and related types.

## Key Files

| File | Description |
|------|-------------|
| `DashItem.ts` | Core data model — `DashItem` interface, `Comment`, `Attachment` interfaces, `Priority` and `RecurrenceRule` types, plus utility functions (`isOverdue`, `getRelevantDate`, `createEmptyItem`) |
| `DashItem.spec.ts` | Unit tests for model utility functions |

## For AI Agents

### Working In This Directory
- `DashItem` is the single entity type — it represents tasks (no separate event type after migration)
- Fields like `links`, `photoPaths`, `comments`, `attachments`, `tags` are arrays stored as JSON strings in SQLite
- Boolean fields (`isCompleted`, `isRecurring`, `hasReminder`) map to SQLite INTEGER (0/1)
- All dates are ISO 8601 strings
- `Priority` is `'none' | 'low' | 'medium' | 'high'`
- `RecurrenceRule` is `'daily' | 'weekly' | 'monthly'`

### Testing Requirements
- Test utility functions (`isOverdue`, `createEmptyItem`) with various date scenarios

### Common Patterns
- Pure functions exported alongside interfaces
- No class instances — plain object interfaces
- Schema changes here must be mirrored in `services/database.ts`, `services/database.schema.ts`, and `ios/App/App/DashDatabase.swift`

## Dependencies

### Internal
- Referenced by nearly every other module in the codebase

### External
- None (pure TypeScript types)

<!-- MANUAL: -->
