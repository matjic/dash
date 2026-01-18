# Testing Guide for Dash

This document provides an overview of the testing infrastructure for the Dash iOS productivity app.

## Test Suite Overview

The Dash app has a comprehensive testing suite covering:
- **Unit Tests**: Testing individual functions, services, and models
- **Integration Tests**: Testing composables with mocked dependencies
- **Component Tests**: Testing Vue components in isolation
- **E2E Tests**: Testing complete user workflows (Playwright)

### Test Statistics

- **Total Tests**: 154 tests (150 passing, 4 skipped)
- **Test Files**: 8 files
- **Coverage**: Services, models, composables, and components

## Running Tests

```bash
# Run all unit and component tests in watch mode
npm run test

# Run all tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts                    # Global test setup and mocks
│   └── mocks/
│       └── capacitor.ts            # Capacitor plugin mocks
├── models/
│   └── DashItem.spec.ts           # Model helper function tests
├── services/
│   ├── nlpParser.spec.ts          # NLP parsing tests
│   ├── recurrenceService.spec.ts  # Recurrence logic tests
│   └── linkService.spec.ts        # Link parsing tests
├── composables/
│   └── useItems.spec.ts           # State management tests
└── components/
    ├── QuickAddBar.spec.ts        # Quick add component tests
    ├── ItemRow.spec.ts            # Item row component tests
    └── FilterTabs.spec.ts         # Filter tabs component tests
tests/
└── e2e/
    ├── timeline.spec.ts           # Timeline flow E2E tests
    └── item-crud.spec.ts          # CRUD operations E2E tests
```

## Test Categories

### 1. Unit Tests

#### Model Tests (`DashItem.spec.ts`)
Tests helper functions for the DashItem model:
- `getRelevantDate()` - Returns correct date for tasks vs events
- `isOverdue()` - Correctly identifies overdue tasks
- `createEmptyItem()` - Creates valid default items

#### Service Tests

**nlpParser (`nlpParser.spec.ts`)**
- Priority parsing: "high priority", "urgent", "asap", "important"
- Recurrence parsing: "daily", "weekly", "monthly"
- Date parsing with chrono-node: "tomorrow", "next Friday", "Jan 20"
- Combined parsing: Multiple keywords in one input

**recurrenceService (`recurrenceService.spec.ts`)**
- Creates 10 recurring task instances
- Daily/weekly/monthly date calculations
- Edge cases: month boundaries, leap years

**linkService (`linkService.spec.ts`)**
- `parseTextWithLinks()` - Identifies URLs in text
- `containsUrl()` - URL detection
- `extractUrls()` - Extracts all URLs
- `openLink()` - Opens URLs with haptic feedback

### 2. Integration Tests

#### useItems Composable (`useItems.spec.ts`)
Tests the main state management composable:
- **Filtering**: By type (all/tasks/events) and search text
- **Sorting**: Incomplete tasks → events → completed tasks
- **CRUD operations**: Create, read, update, delete items
- **Task actions**: Toggle completion, convert task ↔ event

### 3. Component Tests

#### QuickAddBar (`QuickAddBar.spec.ts`)
- Input field rendering and interaction
- Add button enable/disable based on input
- Creating items on Enter or button click
- Clear button functionality
- Search text integration

#### ItemRow (`ItemRow.spec.ts`)
- Renders item title, dates, location, tags
- Shows correct icons for tasks vs events
- Priority indicator display
- Photo indicator when photos attached
- Click event emission
- Overdue and completed styling

**Note**: Complex Ionic swipe actions (toggle, delete, convert) are skipped in unit tests and should be tested in E2E tests instead.

#### FilterTabs (`FilterTabs.spec.ts`)
- Renders all filter options (All, Tasks, Events)
- Emits update event on selection
- Supports v-model binding

### 4. E2E Tests

#### Timeline Flow (`timeline.spec.ts`)
- App loads correctly with header and logo
- Empty state display when no items exist
- QuickAddBar visible and functional
- Filter tabs present and working
- Creating tasks via quick add
- Search/filter functionality
- Input validation (empty input)

#### CRUD Operations (`item-crud.spec.ts`)
- Create and display new items
- Open item detail on click
- Toggle task completion (via swipe)
- Delete items (via swipe with confirmation)
- Natural language date parsing ("tomorrow at 2pm")
- Priority keyword parsing ("urgent")
- Multiple items management
- Data persistence after page reload

## Mocking Strategy

### Capacitor Plugins
All Capacitor plugins are mocked in `src/test/mocks/capacitor.ts`:
- `@capacitor/core` - Platform detection, file conversion
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/keyboard` - Keyboard events
- `@capacitor/local-notifications` - Push notifications
- `@capacitor/camera` - Photo capture
- `@capacitor/filesystem` - File operations
- `@capacitor/browser` - In-app browser
- `@capacitor/share` - Native sharing
- `@capacitor-community/sqlite` - Database operations

### Vue/Ionic Components
Ionic Vue components are stubbed in tests to avoid web component initialization issues. The stubs maintain the component API while simplifying rendering.

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myService';

describe('myService', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' },
    });
    
    expect(wrapper.text()).toContain('Test');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should perform action', async ({ page }) => {
  await page.goto('/');
  await page.click('.my-button');
  await expect(page.locator('.result')).toBeVisible();
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies (database, APIs, native plugins)
3. **Descriptive Names**: Test names should clearly describe what is being tested
4. **AAA Pattern**: Arrange, Act, Assert
5. **One Assertion**: Prefer one logical assertion per test
6. **Fast Tests**: Unit tests should run in milliseconds
7. **E2E for Integration**: Use E2E tests for complex interactions that are hard to unit test

## Continuous Integration

Tests run automatically on:
- **GitHub Actions**: Every push to `main` and all pull requests
- Pre-commit hooks (optional, not configured yet)

The CI workflow (`.github/workflows/test.yml`) runs:
1. Unit tests with coverage reporting
2. E2E tests with Playwright
3. TypeScript type checking
4. Build verification

All jobs run in parallel for fast feedback. Coverage reports and test artifacts are automatically uploaded for review.

## Coverage Goals

Current coverage focus:
- ✅ All services have comprehensive unit tests
- ✅ All models have helper function tests
- ✅ State management (composables) fully tested
- ✅ Components have structural and interaction tests
- ✅ E2E tests cover main user workflows

Future improvements:
- Add visual regression testing
- Increase E2E test coverage for edge cases
- Add performance benchmarking tests

## Troubleshooting

### Tests Failing Locally

1. **Clear node_modules**: `rm -rf node_modules && npm install`
2. **Clear Vitest cache**: `npx vitest --clearCache`
3. **Check Node version**: Ensure you're on Node 18+

### E2E Tests Failing

1. **Dev server not starting**: Check port 5173 is available
2. **Browser issues**: Run `npx playwright install`
3. **Timeout issues**: Increase timeout in `playwright.config.ts`

### Mock Issues

If mocks aren't working:
1. Check mock is defined before import
2. Verify mock path matches actual import
3. Use `vi.clearAllMocks()` in `beforeEach`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)
