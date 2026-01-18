# AGENTS.md

This document provides guidance for AI agents working on the Dash codebase.

## Project Overview

**Dash** is a native iOS productivity app built with **Capacitor + Ionic + Vue 3 + TypeScript**. It combines task management and event tracking into a unified timeline with natural language quick-capture.

- **App ID:** `co.matj.dash`
- **Platform:** iOS (Capacitor)
- **Framework:** Ionic Vue with iOS-style UI
- **Language:** TypeScript
- **Architecture:** Local-first, no backend/authentication

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | Ionic Vue 8 |
| Frontend | Vue 3 (Composition API) |
| Language | TypeScript |
| Native Runtime | Capacitor 8 |
| Database | @capacitor-community/sqlite |
| NLP | chrono-node (date parsing) |
| Routing | vue-router |

## Project Structure

```
dash/
├── src/
│   ├── main.ts              # App entry point
│   ├── App.vue              # Root component
│   ├── router/index.ts      # Route definitions
│   ├── views/
│   │   ├── MainTimeline.vue # Primary list view
│   │   └── ItemDetail.vue   # Create/edit form
│   ├── components/
│   │   ├── QuickAddBar.vue  # Bottom input for quick capture
│   │   ├── ItemRow.vue      # Single item in timeline
│   │   └── FilterTabs.vue   # All/Tasks/Events filter
│   ├── composables/
│   │   └── useItems.ts      # Item state management
│   ├── services/
│   │   ├── database.ts      # SQLite persistence
│   │   ├── nlpParser.ts     # Natural language parsing
│   │   ├── notificationService.ts
│   │   ├── recurrenceService.ts
│   │   └── photoService.ts
│   ├── models/
│   │   └── DashItem.ts      # Primary data model
│   └── theme/
│       └── variables.css    # Ionic CSS variables
├── ios/                     # Native iOS project (Capacitor)
│   └── App/
│       └── App/Assets.xcassets/
│           ├── AppIcon.appiconset/  # App icons (light/dark)
│           └── Splash.imageset/     # Launch screen
├── dist/                    # Built web assets
├── capacitor.config.ts      # Capacitor configuration
├── package.json
├── vite.config.ts
└── spec.md                  # Detailed feature specification
```

## Key Commands

```bash
# Development
npm run dev          # Start Vite dev server

# Build
npm run build        # TypeScript check + Vite build

# iOS
npm run ios          # Build + sync + open Xcode
npm run ios:sync     # Build + sync to iOS project
npm run ios:run      # Build + sync + run on device/simulator
```

## Data Model

The primary entity is `DashItem`, which represents both tasks and events:

- **Tasks:** Have `dueDate`, `isCompleted`, `priority`, `tags`, recurrence, and reminders
- **Events:** Have `eventDate` and optional `endDate`
- Distinguished by the `itemType` field ("task" or "event")

See `src/models/DashItem.ts` for the full interface and `spec.md` for detailed documentation.

## Development Guidelines

### Vue Components

- Use **Composition API** with `<script setup lang="ts">`
- Use Ionic Vue components (`IonPage`, `IonContent`, `IonList`, etc.)
- App is forced to iOS styling mode (`mode: 'ios'` in main.ts)

### State Management

- Use Vue composables in `src/composables/` for shared state
- No external state library (Vuex/Pinia) - keep it simple

### Services

- Services in `src/services/` are plain TypeScript modules
- Database operations go through `database.ts`
- Natural language parsing uses `chrono-node` via `nlpParser.ts`

### Styling

- Use Ionic CSS utilities and components
- Custom variables in `src/theme/variables.css`
- Dark mode is automatic via system preference
- **All new components must support both light and dark modes.** Use Ionic CSS variables (e.g., `--ion-background-color`, `--ion-text-color`, `--ion-color-primary`) rather than hardcoded colors to ensure proper theming. Test components in both modes to verify adequate contrast and readability.

### Capacitor Plugins

Active plugins:
- `@capacitor/camera` - Photo attachments
- `@capacitor/filesystem` - File storage
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/keyboard` - Keyboard handling
- `@capacitor/local-notifications` - Reminders
- `@capacitor-community/sqlite` - Local database

### iOS Native

- Native project is in `ios/App/`
- App icons support light/dark mode variants
- Run `npx cap sync ios` after changing Capacitor config or plugins
- Open Xcode with `npx cap open ios`

## Testing Changes

**IMPORTANT:** Always run `npm run ios:sync` after making any changes to ensure the iOS project is updated.

1. Run `npm run build` to check TypeScript and build
2. Run `npm run ios:sync` to sync to iOS
3. Test in Xcode simulator or on device
4. **Update `README.md` if applicable** when you:
   - Add new features or capabilities
   - Change development commands or workflows
   - Add/remove dependencies or plugins
   - Modify project structure
   - Update setup/installation steps

## Important Files to Know

| File | Purpose |
|------|---------|
| `README.md` | User and developer documentation |
| `AGENTS.md` | This file - agent/contributor guidance |
| `TESTING.md` | Testing strategy and guidelines |
| `spec.md` | Comprehensive feature specification |
| `capacitor.config.ts` | App ID, plugins, native settings |
| `src/services/database.ts` | All database operations |
| `src/services/nlpParser.ts` | Natural language parsing logic |
| `src/composables/useItems.ts` | Item CRUD and state |
| `src/models/DashItem.ts` | Data model definition |

## Common Tasks

### Adding a new Capacitor plugin

```bash
npm install @capacitor/plugin-name
npx cap sync ios
```

### Modifying the app icon

Icons are in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- `AppIcon-512@2x.png` - Light mode (1024x1024)
- `AppIcon-512@2x-dark.png` - Dark mode (1024x1024)

Source SVGs are in the root: `dash_d_tight_light.svg`, `dash_d_tight_dark.svg`

### Adding a new view

1. Create component in `src/views/`
2. Add route in `src/router/index.ts`
3. Use `IonPage` as the root element

### Adding a new service

1. Create module in `src/services/`
2. Export functions (not classes, keep it simple)
3. Import and use in components/composables
