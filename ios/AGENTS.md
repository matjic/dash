<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# ios

## Purpose
Native iOS project generated and managed by Capacitor. Contains Swift source code for custom native plugins, Siri Shortcuts integration, Share Extension, and Xcode project configuration.

## Key Files

| File | Description |
|------|-------------|
| `debug.xcconfig` | Xcode debug build configuration |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `App/` | Main Xcode workspace with app source, project files, and share extension (see `App/App/AGENTS.md`) |
| `capacitor-cordova-ios-plugins/` | Auto-generated Cordova plugin bridge (do not edit manually) |

## For AI Agents

### Working In This Directory
- Run `bunx cap sync ios` after any Capacitor config or plugin changes
- Open Xcode with `bunx cap open ios` or `bun run ios`
- The `capacitor-cordova-ios-plugins/` directory is auto-generated — never edit manually
- Native Swift files are in `App/App/` — that's where custom plugins live

### Testing Requirements
- Build and test via Xcode simulator or physical device
- Run `bun run ios:run` for a full build-sync-run cycle
- After any `src/` changes, run `bun run ios:sync` to update the web assets

### Common Patterns
- Custom Capacitor plugins follow the pattern: Swift class + `@objc` methods + TypeScript interface in `src/services/`
- Database schema changes must be synchronized between `src/services/database.ts` and `App/App/DashDatabase.swift`

## Dependencies

### Internal
- `src/services/database.schema.ts` — canonical schema definition shared with Swift
- `src/services/pdfService.ts` — TypeScript interface for the native PdfGenerator plugin

### External
- Capacitor 8 iOS runtime
- SQLite (via `@capacitor-community/sqlite`)

<!-- MANUAL: -->
