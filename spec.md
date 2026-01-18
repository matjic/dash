# Dash - Technical Specification

A unified task and event tracking application with quick-capture capabilities and natural language processing.

---

## 1. Overview

**Application Type:** Native mobile productivity application

**Purpose:** Dash is a personal productivity app that combines task management and event tracking into a single unified timeline. It emphasizes quick capture through natural language input, allowing users to rapidly create tasks and events without navigating complex forms.

**Core Value Proposition:**
- Unified view of tasks and events in a single timeline
- Quick capture with natural language parsing (dates, priorities, recurrence)
- Seamless conversion between tasks and events
- Local-first architecture with no account required

---

## 2. Architecture Overview

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│         Views, Components, Navigation, User Input            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
│   Natural Language Parser │ Notifications │ Recurrence       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│              Models, Persistence, State Management           │
└─────────────────────────────────────────────────────────────┘
```

### Component Organization

```
Application
├── Models/
│   ├── DashItem          # Primary entity (task or event)
│   ├── ItemType          # Enum: task, event
│   └── Priority          # Enum: none, low, medium, high
├── Views/
│   ├── MainTimeline      # Primary list view with filtering
│   ├── ItemDetail        # Create/edit form
│   └── Components/
│       ├── QuickAddBar   # Bottom input for quick capture
│       └── ItemRow       # Single item in timeline
└── Services/
    ├── NaturalLanguageParser
    ├── NotificationService
    └── RecurrenceService
```

---

## 3. Data Models

### DashItem (Primary Entity)

A unified model representing both tasks and events, distinguished by the `itemType` field.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier (auto-generated) |
| `title` | String | Yes | Item title |
| `notes` | String | No | Additional description or notes |
| `createdDate` | DateTime | Yes | When the item was created (auto-set) |
| `location` | String | No | Location text |
| `links` | String[] | No | Array of URL strings |
| `photoData` | Binary | No | Single image attachment |
| `itemType` | ItemType | Yes | Discriminator: "task" or "event" |

**Task-Specific Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isCompleted` | Boolean | Yes | Completion status (default: false) |
| `dueDate` | DateTime | No | Task deadline |
| `priority` | Priority | Yes | Priority level (default: none) |
| `tags` | String[] | No | Categorization tags |
| `isRecurring` | Boolean | Yes | Whether task repeats (default: false) |
| `recurrenceRule` | String | No | Pattern: "daily", "weekly", "monthly" |
| `hasReminder` | Boolean | Yes | Notification enabled (default: false) |
| `reminderDate` | DateTime | No | When to send notification |

**Event-Specific Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventDate` | DateTime | Yes | When the event occurs |
| `endDate` | DateTime | No | Event end time |

**Computed Properties:**

| Property | Logic |
|----------|-------|
| `relevantDate` | Returns `dueDate` for tasks, `eventDate` for events |
| `isOverdue` | True if task is incomplete and `dueDate` is in the past |

### ItemType (Enum)

| Value | Display Name | Icon |
|-------|--------------|------|
| `task` | "Task" | Checkmark circle |
| `event` | "Event" | Calendar |

### Priority (Enum)

| Value | Display Name | Color |
|-------|--------------|-------|
| `none` | "None" | Gray |
| `low` | "Low" | Green |
| `medium` | "Medium" | Orange |
| `high` | "High" | Red |

### Entity Relationships

The data model is intentionally flat with no foreign key relationships:

```
DashItem
├── itemType → ItemType (stored as string)
├── priority → Priority (stored as string)
├── tags → String[] (embedded array)
└── links → String[] (embedded array)
```

---

## 4. Core Features

### 4.1 Quick Capture

A bottom-positioned input bar for rapid item creation using natural language.

**Capabilities:**
- Parse dates from text (e.g., "tomorrow", "next Friday", "Dec 15")
- Detect priority keywords (e.g., "high priority", "urgent", "asap")
- Recognize recurrence patterns (e.g., "daily", "every week", "monthly")
- Clean parsed keywords from the final title

**Example:**
```
Input:  "Team meeting tomorrow at 2pm high priority"
Result: Title="Team meeting", DueDate=tomorrow 2pm, Priority=high
```

### 4.2 Unified Timeline

A single chronological list displaying both tasks and events.

**Features:**
- Segmented filter: All / Tasks / Events
- Real-time search across title, notes, location, and tags
- Visual distinction between tasks and events
- Priority indicators (colored dots)
- Overdue highlighting for past-due tasks
- Completion status for tasks (strikethrough when complete)

### 4.3 Task Management

- Mark tasks complete/incomplete via swipe action
- Set due dates and reminders
- Assign priority levels
- Add tags for categorization
- Create recurring tasks (daily/weekly/monthly)

### 4.4 Event Management

- Set event date and optional end date
- All standard metadata (location, notes, links, photo)
- Events appear in timeline sorted by date

### 4.5 Reminders & Notifications

- Local push notifications for task reminders
- Configurable reminder date/time
- Automatic cancellation when task is completed or deleted
- Permission request on first use

### 4.6 Recurring Tasks

- Support for daily, weekly, and monthly recurrence
- Creates multiple future instances when enabled
- Each instance is independent (completing one doesn't affect others)

### 4.7 Attachments

- Single photo attachment per item
- Multiple URL links per item

---

## 5. User Workflows

### 5.1 Quick Add Flow

```
1. User types in quick add bar
   └── Natural language text (e.g., "Buy groceries tomorrow")
2. User taps add button
3. System parses input
   ├── Extract dates → dueDate
   ├── Extract priority → priority
   ├── Extract recurrence → isRecurring, recurrenceRule
   └── Clean title → title
4. System creates DashItem (type: task)
5. If hasReminder: Schedule notification
6. If isRecurring: Generate future occurrences
7. Item appears in timeline
8. Input field clears
```

### 5.2 Task Completion Flow

```
1. User swipes right on task row
2. User taps "Complete" action
3. System toggles isCompleted
4. If completing:
   └── Cancel pending reminder notification
5. If uncompleting and hasReminder:
   └── Reschedule notification
6. UI updates (strikethrough, checkmark)
```

### 5.3 Item Editing Flow

```
1. User taps on item row
2. Detail view opens with all fields
3. User modifies fields as needed
4. User taps "Save"
5. System updates item
6. If reminder changed: Update notification schedule
7. View dismisses, timeline refreshes
```

### 5.4 Type Conversion Flow

```
Task → Event:
1. User swipes left on task
2. User taps "Convert to Event"
3. System:
   ├── Sets itemType = event
   ├── Copies dueDate to eventDate
   ├── Clears dueDate
   └── Resets isCompleted = false

Event → Task:
1. User swipes left on event
2. User taps "Convert to Task"
3. System:
   ├── Sets itemType = task
   └── Copies eventDate to dueDate
```

### 5.5 Delete Flow

```
1. User swipes right on item
2. User taps "Delete" action
3. System cancels any pending notifications
4. System removes item from database
5. Item animates out of timeline
```

---

## 6. Services

### 6.1 Natural Language Parser

Extracts structured data from free-form text input.

**Input:** Raw text string
**Output:** Parsed item structure

| Extraction | Method | Examples |
|------------|--------|----------|
| Dates | Date detection algorithm | "tomorrow", "next week", "Dec 15" |
| Priority | Keyword matching | "high priority", "urgent", "low" |
| Recurrence | Keyword matching | "daily", "every week", "monthly" |

**Priority Keywords:**
- High: "high priority", "urgent", "asap"
- Medium: "medium priority", "normal"
- Low: "low priority", "low"

**Recurrence Keywords:**
- Daily: "daily", "every day"
- Weekly: "weekly", "every week"
- Monthly: "monthly", "every month"

### 6.2 Notification Service

Manages local push notifications for reminders.

**Operations:**
- `requestPermission()` - Request notification authorization
- `scheduleReminder(item)` - Schedule notification for item
- `cancelReminder(item)` - Remove pending notification
- `updateReminder(item)` - Cancel and reschedule

**Notification Content:**
- Title: Item title
- Trigger: Calendar-based (specific date/time)
- Identifier: Item UUID (for cancellation)

### 6.3 Recurrence Service

Generates future instances of recurring tasks.

**Operation:** `createRecurringTasks(originalItem)`

**Behavior:**
- Creates 10 future occurrences
- Copies all properties from original
- Calculates next date based on recurrence rule
- Each occurrence is an independent item

**Date Calculation:**
- Daily: Add 1 day
- Weekly: Add 7 days
- Monthly: Add 1 month

---

## 7. Business Rules

### 7.1 Sorting Logic

Timeline items are sorted with the following priority:

1. **Incomplete tasks first** - Active tasks appear before events and completed tasks
2. **By relevant date** - Earlier dates appear first
3. **Within same category** - Chronological order

```
Sort Priority:
1. Incomplete Task (by dueDate ascending)
2. Events (by eventDate ascending)
3. Completed Tasks (by dueDate ascending)
```

### 7.2 Validation Rules

| Rule | Enforcement |
|------|-------------|
| Title required | Save button disabled when title is empty or whitespace |
| Reminder date in future | Notifications only scheduled for future dates |
| No duplicate tags | Tag addition rejected if already exists |
| Quick add non-empty | Add button disabled for empty input |

### 7.3 Filter Behavior

**Type Filter:**
- All: Show all items
- Tasks: Show only items where `itemType == task`
- Events: Show only items where `itemType == event`

**Search Filter:**
- Case-insensitive matching
- Searches across: title, notes, location, tags
- Real-time filtering as user types
- Combined with type filter (AND logic)

### 7.4 Notification Rules

| Condition | Behavior |
|-----------|----------|
| Task completed | Cancel pending notification |
| Task deleted | Cancel pending notification |
| Reminder date changed | Cancel old, schedule new |
| Reminder disabled | Cancel pending notification |
| Reminder in past | Do not schedule |

### 7.5 Type Conversion Rules

| From | To | Field Mapping |
|------|-----|---------------|
| Task | Event | `dueDate` → `eventDate`, clear `dueDate`, reset `isCompleted` |
| Event | Task | `eventDate` → `dueDate`, reset `eventDate` to now |

---

## 8. State Management

### Application State

| State | Scope | Description |
|-------|-------|-------------|
| `items` | Global | All DashItems from persistence |
| `searchText` | Main View | Current search/input text |
| `selectedFilter` | Main View | Active filter (all/tasks/events) |
| `selectedItem` | Main View | Item selected for navigation |

### Derived State

| Property | Derivation |
|----------|------------|
| `filteredItems` | `items` filtered by `searchText` and `selectedFilter`, then sorted |

### Data Flow

```
User Input → View State → Service Layer → Persistence
                              ↓
                    Side Effects (Notifications)
```

---

## 9. Persistence

### Storage

- Local database (no cloud sync)
- Single-user (no authentication)
- Offline-first operation

### Operations

| Operation | Trigger |
|-----------|---------|
| Create | Quick add, detail view save (new item) |
| Read | App launch, view refresh |
| Update | Detail view save (existing item), swipe actions |
| Delete | Swipe delete action |

---

## 10. Screens Summary

| Screen | Purpose | Key Actions |
|--------|---------|-------------|
| Main Timeline | Display all items with filtering | Search, filter, navigate to detail, swipe actions |
| Item Detail | Create or edit an item | Edit all fields, save, cancel |
| Quick Add Bar | Rapid item creation | Type, add |

---

## Appendix: Supported Natural Language Patterns

### Date Patterns
- Relative: "today", "tomorrow", "next week"
- Absolute: "December 15", "12/15", "2024-12-15"
- Time: "at 2pm", "at 14:00"

### Priority Patterns
- High: "high priority", "urgent", "asap", "important"
- Medium: "medium priority", "normal priority"
- Low: "low priority", "low"

### Recurrence Patterns
- Daily: "daily", "every day"
- Weekly: "weekly", "every week"
- Monthly: "monthly", "every month"
