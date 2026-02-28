<!-- Parent: ../../../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# App (iOS Native Source)

## Purpose
Native Swift source code for the Dash iOS app. Contains the AppDelegate, custom Capacitor plugins, Siri Shortcuts integration, and the shared SQLite database layer used by both the main app and the Share Extension.

## Key Files

| File | Description |
|------|-------------|
| `AppDelegate.swift` | App lifecycle — configures Capacitor bridge and registers custom plugins |
| `DashBridgeViewController.swift` | Custom Capacitor view controller with native bridge extensions |
| `DashDatabase.swift` | Native SQLite database access — used by Share Extension and Siri Shortcuts to write directly to the shared database. **Must stay in sync with `src/services/database.ts` and `src/services/database.schema.ts`** |
| `DashIntents.swift` | Siri Shortcuts intent handlers — enables "Add Task" via Siri |
| `DashShortcuts.swift` | App Shortcuts provider — defines available Siri Shortcuts |
| `PdfGeneratorPlugin.swift` | Native Capacitor plugin for generating PDFs from HTML content (bridges to `src/services/pdfService.ts`) |
| `Info.plist` | iOS app configuration — permissions, URL schemes (`dash://`), capabilities |
| `config.xml` | Capacitor/Cordova plugin configuration |
| `capacitor.config.json` | Generated Capacitor config for native runtime |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `Assets.xcassets/` | App icons (light/dark variants) and splash screen images |
| `Base.lproj/` | Storyboard/XIB files for launch screen |
| `public/` | Built web assets copied by `cap sync` (do not edit manually) |

## For AI Agents

### Working In This Directory
- **Critical**: `DashDatabase.swift` must stay in sync with `src/services/database.schema.ts` — column names, types, and order must match exactly
- Custom Capacitor plugins: implement `CAPPlugin` subclass with `@objc` annotated methods
- The `public/` directory is overwritten by `bunx cap sync ios` — never edit files there
- App icons: `Assets.xcassets/AppIcon.appiconset/` has both light and dark variants
- URL scheme `dash://` is registered in `Info.plist` for deep links

### Testing Requirements
- Run `src/services/database.sync.spec.ts` to verify schema sync between TypeScript and Swift
- Test Siri Shortcuts manually on a physical device
- Test Share Extension by sharing content from Safari/Photos to Dash

### Common Patterns
- Capacitor plugin pattern: `@objc func methodName(_ call: CAPPluginCall)` → `call.resolve(["key": value])`
- Database writes use the shared `DashDatabase` class for App Group access
- Siri intents use `DashShortcuts` + `DashIntents` pattern

## Dependencies

### Internal
- `src/services/database.schema.ts` — canonical column definitions
- `src/services/pdfService.ts` — TypeScript interface for PdfGenerator plugin
- `../../DashShareExtension/` — Share Extension reads/writes via shared App Group container

### External
- Capacitor iOS 8.x runtime
- SQLite3 (system framework)
- WebKit (for PDF generation)

<!-- MANUAL: -->
