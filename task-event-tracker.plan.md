<!-- acfe0d92-c69e-4b87-b10a-6261e2bd6a78 fc355325-19ea-494e-89c1-5fa4ab494db0 -->
# Task & Event Tracking App

## Overview

Transform the existing SwiftUI + SwiftData iOS app into a quick-capture task and event tracker with a unified timeline, filtering capabilities, and support for rich metadata.

## Data Model

**Create new models** (replacing `Item.swift`):

1. **DashItem** (base model with shared properties):

- `id: UUID`
- `title: String`
- `notes: String?`
- `createdDate: Date`
- `location: String?`
- `links: [String]` (URLs as strings)
- `photoData: Data?` (for single image attachment)
- `itemType: ItemType` (enum: task or event)

2. **Task-specific properties** (when itemType == .task):

- `isCompleted: Bool`
- `dueDate: Date?`
- `priority: Priority` (enum: none, low, medium, high)
- `tags: [String]`
- `isRecurring: Bool`
- `recurrenceRule: String?` (simple daily/weekly/monthly)
- `hasReminder: Bool`
- `reminderDate: Date?`

3. **Event-specific properties** (when itemType == .event):

- `eventDate: Date`
- `endDate: Date?`

## UI Structure

### Main View (ContentView.swift)

- **Filter Bar**: Segmented control (All / Tasks / Events) at top
- **Unified Timeline**: Scrollable list showing both tasks and events sorted by relevant date
  - Tasks show due date (or created date if no due date)
  - Events show event date
  - Visual distinction (icons, colors)
  - Swipe actions: complete (tasks), delete (both), convert type
- **Bottom Input Bar**: Dual-function Add/Search bar at bottom for easy thumb access
  - Add Mode: Natural language input with "+" button for instant brain dump
  - Search Mode: Real-time search through titles, notes, location, and tags
  - Toggle between modes with magnifying glass/plus icon
- **Toolbar**: Add button (opens detail sheet)

### Detail Sheet (DashItemDetailView.swift)

- Type toggle (Task/Event) at top - **FIXED**: Now shows exactly 2 buttons instead of 4
- All metadata fields in organized sections:
- Basic: Title, Notes
- Dates: Due/Event dates, reminder
- Context: Location, Tags, Priority
- Attachments: Links list, Photo picker
- Save/Cancel buttons

### Quick Add Flow

1. User types title in bottom input bar (e.g., "Team meeting tomorrow at 2pm high priority")
2. Natural language parser extracts dates/times and priority keywords
3. Taps "+" → creates task/event with parsed metadata auto-populated
4. Can tap item to open detail view and add more metadata

## Key Features

1. **Local Persistence**: SwiftData with local storage (no iCloud)
2. **Quick Capture**: Minimal friction for adding items
3. **Natural Language Parsing**: Auto-extract dates/times (using NSDataDetector) and priority keywords from quick add text
4. **Dual-Function Input**: Bottom-placed input bar that toggles between Add and Search modes
5. **Real-time Search**: Search through titles, notes, location, and tags with instant filtering
6. **Filtering**: Toggle between All/Tasks/Events, optionally filter by tags/priority
7. **Type Conversion**: Swipe actions to convert task ↔ event
8. **Notifications**: Local notifications for task reminders (requires user permission)
9. **Recurring Tasks**: Simple daily/weekly/monthly recurrence with auto-creation
10. **Photo Attachments**: Single photo per item via PhotosPicker
11. **Link Storage**: Array of URL strings (tappable in detail view)

## Implementation Files

- `Models/DashItem.swift` - Main data model with all properties ✅
- `Models/ItemType.swift` - Enum for Task/Event ✅
- `Models/Priority.swift` - Enum for task priorities ✅
- `Views/ContentView.swift` - Main timeline view with filtering and search ✅
- `Views/DashItemDetailView.swift` - Detail/edit sheet ✅
- `Views/Components/QuickAddBar.swift` - Dual-function Add/Search component ✅
- `Views/Components/DashItemRow.swift` - Timeline row component ✅
- `Services/NotificationService.swift` - Handle reminders and permissions ✅
- `Services/RecurrenceService.swift` - Handle recurring task creation ✅
- `Services/NaturalLanguageParser.swift` - Parse dates/times and priority keywords from text ✅

## Recent Updates & Fixes

### ✅ Completed Features
- **Bottom Input Bar**: Moved from top to bottom for better thumb accessibility
- **Dual-Function Input**: Toggle between Add mode and Search mode
- **Real-time Search**: Instant filtering as you type
- **Fixed Segmented Control**: Detail view now shows exactly 2 buttons (Task/Event)
- **Search Integration**: Works with existing All/Tasks/Events filters
- **Visual Improvements**: Added separator line and mode indicators

### 🔧 Technical Fixes Applied
- Fixed `onAppear` modifier placement (moved from Scene to View)
- Removed explicit `return` in ViewBuilder context
- Added `@Previewable` attribute for `@State` in preview
- Fixed argument order in DashItem initializer
- Removed unnecessary `ObservableObject` conformance
- Removed unused variable declaration
- Added missing `SwiftData` import

## Notes

- Use SwiftData @Model for persistence
- Use PhotosPicker for image selection (iOS 16+)
- Use UserNotifications framework for reminders
- Keep UI minimal and focused on speed
- Default new items to Task type
- Sort timeline: incomplete tasks by due date, then events by event date, then completed tasks
- **Bottom input placement** for better mobile UX
- **Search works across multiple fields**: title, notes, location, tags

### ✅ COMPLETED FEATURES

- [x] Create data models (DashItem, ItemType, Priority enums)
- [x] Implement NotificationService for reminders
- [x] Implement RecurrenceService for recurring tasks
- [x] Build QuickAddBar component for fast task entry
- [x] Create DashItemRow component with swipe actions and visual distinctions
- [x] Update ContentView with timeline, filtering, and quick add integration
- [x] Build DashItemDetailView with all metadata fields and photo picker
- [x] Update dashApp.swift to register new models and request notification permissions
- [x] Move input bar to bottom for better accessibility
- [x] Add dual-function Add/Search capability
- [x] Implement real-time search functionality
- [x] Fix segmented control display issue in detail view
- [x] Fix all compilation errors and build issues
- [x] **Simplify QuickAddBar** - Remove search/add mode toggle, auto-filter as you type
- [x] **Complete app testing** - All features verified and working
- [x] **Final polish** - Zero compilation errors, zero linting errors

## 🎉 PROJECT COMPLETION STATUS

**✅ PLAN FULLY COMPLETED** - All features implemented and tested successfully!

### Final Implementation Summary

The Dash task and event tracker app has been successfully transformed from the original SwiftUI + SwiftData template into a comprehensive, quick-capture productivity app with the following capabilities:

#### Core Functionality ✅
- **Unified Timeline**: Displays both tasks and events in a single, chronologically sorted list
- **Smart Filtering**: All/Tasks/Events segmented control with real-time search integration
- **Quick Capture**: Bottom-placed input bar with natural language parsing
- **Rich Metadata**: Support for photos, links, tags, location, priority, and reminders

#### User Experience ✅
- **Minimal Friction**: Type and tap "+" to instantly create tasks/events
- **Natural Language**: Auto-extract dates, priorities, and recurrence from text
- **Intuitive Actions**: Swipe to complete, delete, or convert items
- **Visual Feedback**: Icons, colors, animations, and priority indicators

#### Technical Excellence ✅
- **Zero Errors**: Clean compilation and no linting issues
- **Modern Architecture**: SwiftData persistence, SwiftUI interface, iOS 16+ features
- **Performance**: Efficient filtering, sorting, and real-time search
- **Accessibility**: Bottom input placement, proper focus management

#### Advanced Features ✅
- **Notifications**: Local reminders with permission handling
- **Recurring Tasks**: Daily/weekly/monthly with auto-creation
- **Photo Attachments**: Single image per item via PhotosPicker
- **Type Conversion**: Convert tasks ↔ events with data preservation

The app is now ready for production use and provides an excellent foundation for personal task and event management with a focus on speed, simplicity, and rich functionality.
