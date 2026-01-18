# Dash

A unified task and event tracking application with natural language quick-capture capabilities for iOS.

## Overview

**Dash** is a native iOS productivity app that combines task management and event tracking into a single, unified timeline. Capture tasks and events using natural language input, manage priorities and due dates, set reminders, and track everything in one beautiful, iOS-native interface.

**App ID**: `co.matj.dash`  
**Platform**: iOS (native via Capacitor)

## Features

### Core Functionality
- **Unified Timeline**: View tasks and events together in a single, chronologically sorted list
- **Natural Language Quick-Capture**: Create items instantly with phrases like "Meeting tomorrow at 2pm" or "Urgent call John by Friday"
- **Smart Filtering**: Filter by All, Tasks, or Events with real-time search
- **Local-First**: All data stored locally with SQLite - no authentication or cloud sync required

### Task Management
- Due dates with overdue detection
- Priority levels (High, Medium, Low)
- Recurring tasks (daily, weekly, monthly)
- Local notifications and reminders
- Task completion tracking
- Tags for organization

### Event Tracking
- Start and end times
- Location support
- All-day event support
- Photo attachments

### User Experience
- Native iOS design with Ionic components
- Automatic dark mode support
- Haptic feedback for interactions
- Swipe actions for quick operations
- Photo attachments via camera or gallery

## Tech Stack

| Layer | Technology |
|-------|------------|
| **UI Framework** | Ionic Vue 8 (iOS-style components) |
| **Frontend** | Vue 3 (Composition API + TypeScript) |
| **Native Runtime** | Capacitor 8 |
| **Database** | @capacitor-community/sqlite |
| **NLP** | chrono-node (date parsing) |
| **Testing** | Vitest (unit), Playwright (e2e) |
| **Build Tool** | Vite |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (LTS version recommended)
- **npm** (comes with Node.js)
- **Xcode** (for iOS development)
- **iOS Simulator** or a physical iOS device for testing

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dash.git
cd dash

# Install dependencies
npm install

# Sync the iOS project
npx cap sync ios
```

### Development

```bash
# Start the development server (web preview)
npm run dev

# Build the app
npm run build

# Open in Xcode
npm run ios

# Build, sync, and open in Xcode (full workflow)
npm run ios

# Build, sync, and run on device/simulator
npm run ios:run

# Just sync changes to iOS (after building)
npm run ios:sync
```

### Testing

```bash
# Run unit tests (watch mode)
npm test

# Run all tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

**Test Coverage**: 154 tests across 8 test files covering services, models, composables, components, and E2E workflows. See [TESTING.md](TESTING.md) for detailed testing documentation.

## Project Structure

```
dash/
├── src/
│   ├── main.ts                      # App entry point
│   ├── App.vue                      # Root component
│   ├── router/index.ts              # Route definitions
│   ├── views/
│   │   ├── MainTimeline.vue         # Primary timeline view
│   │   └── ItemDetail.vue           # Create/edit item form
│   ├── components/
│   │   ├── QuickAddBar.vue          # Bottom quick-capture input
│   │   ├── ItemRow.vue              # Timeline item display
│   │   ├── FilterTabs.vue           # All/Tasks/Events filter
│   │   ├── PhotoViewer.vue          # Photo attachment viewer
│   │   └── RichText.vue             # Rich text display with links
│   ├── composables/
│   │   └── useItems.ts              # Item state management
│   ├── services/
│   │   ├── database.ts              # SQLite persistence
│   │   ├── nlpParser.ts             # Natural language parsing
│   │   ├── notificationService.ts   # Local notifications
│   │   ├── recurrenceService.ts     # Recurring task logic
│   │   ├── photoService.ts          # Photo management
│   │   └── linkService.ts           # URL parsing and handling
│   ├── models/
│   │   └── DashItem.ts              # Core data model
│   ├── theme/
│   │   └── variables.css            # Ionic CSS variables
│   └── test/
│       ├── setup.ts                 # Test configuration
│       └── mocks/                   # Capacitor mocks
├── ios/                             # Native iOS project
│   └── App/
│       └── App/
│           ├── Assets.xcassets/     # App icons & splash
│           └── Info.plist           # iOS app configuration
├── tests/
│   └── e2e/                         # Playwright E2E tests
├── capacitor.config.ts              # Capacitor configuration
├── vite.config.ts                   # Vite build configuration
├── playwright.config.ts             # Playwright test configuration
└── package.json                     # Dependencies and scripts
```

## Architecture

### Data Model

The core entity is `DashItem`, which represents both tasks and events:

- **Tasks**: Have `dueDate`, `isCompleted`, `priority`, `tags`, recurrence, and reminders
- **Events**: Have `eventDate` and optional `endDate`
- Distinguished by the `itemType` field ("task" or "event")

See [`src/models/DashItem.ts`](src/models/DashItem.ts) for the complete interface.

### State Management

State is managed using Vue 3 composables:
- `useItems()` provides all item CRUD operations, filtering, and sorting
- No external state library (Vuex/Pinia) - keeping it simple with Vue's reactivity

### Services

All business logic is encapsulated in plain TypeScript modules in `src/services/`:
- **database.ts**: All SQLite operations
- **nlpParser.ts**: Natural language date and priority parsing using chrono-node
- **notificationService.ts**: Local notification scheduling
- **recurrenceService.ts**: Generates recurring task instances
- **photoService.ts**: Camera and filesystem integration
- **linkService.ts**: URL detection and opening

## Natural Language Parsing

The quick-capture bar supports natural language input:

**Date Parsing:**
- "tomorrow at 2pm"
- "next Friday"
- "Jan 20 3:30pm"
- "in 3 days"

**Priority Keywords:**
- "urgent", "asap", "important" → High priority
- Default → Medium priority

**Recurrence:**
- "daily", "every day"
- "weekly", "every week"
- "monthly", "every month"

## Development Guidelines

### Code Style
- Use **Vue 3 Composition API** with `<script setup lang="ts">`
- Use **Ionic Vue components** for UI consistency
- App is forced to iOS styling mode (`mode: 'ios'` in main.ts)
- TypeScript strict mode enabled

### Styling
- Use Ionic CSS utilities and components
- Custom CSS variables in `src/theme/variables.css`
- Dark mode is automatic via system preference
- **All components must support both light and dark modes** using Ionic CSS variables

### Testing
- Write unit tests for all services and composables
- Component tests for Vue components
- E2E tests for critical user workflows
- See [TESTING.md](TESTING.md) for detailed testing guide

### Making Changes
1. Make code changes in `src/`
2. Run `npm run build` to verify TypeScript
3. Run `npm run test:run` to verify tests pass
4. Run `npm run ios:sync` to sync to iOS project
5. Test in Xcode simulator or on device

**Important**: Always run `npm run ios:sync` after changes to ensure the iOS project is updated.

## Capacitor Plugins

The app uses these Capacitor plugins:
- `@capacitor/camera` - Photo capture
- `@capacitor/filesystem` - File storage
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/keyboard` - Keyboard handling
- `@capacitor/local-notifications` - Reminders
- `@capacitor/browser` - In-app browser
- `@capacitor/share` - Native sharing
- `@capacitor-community/sqlite` - Local database

### Adding a New Plugin

```bash
npm install @capacitor/plugin-name
npx cap sync ios
```

## Documentation

- **[AGENTS.md](AGENTS.md)**: Comprehensive guide for AI agents and contributors (architecture, commands, conventions)
- **[TESTING.md](TESTING.md)**: Detailed testing strategy and guidelines

## Contributing

This is a personal project, but suggestions and feedback are welcome! Please:
1. Follow the code style and conventions outlined in [AGENTS.md](AGENTS.md)
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Test on iOS simulator/device

## Roadmap

Potential future enhancements:
- Cloud sync and backup
- Shared lists/events
- Calendar integration
- Widgets
- Apple Watch companion app
- Additional recurrence patterns

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with** 🧡 **using Vue 3, Ionic, and Capacitor**
