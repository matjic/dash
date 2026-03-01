<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# test

## Purpose
Test infrastructure — setup file and Capacitor plugin mocks for Vitest.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `mocks/` | Mock implementations of Capacitor native plugins for jsdom test environment |

## Key Files

| File | Description |
|------|-------------|
| `mocks/capacitor.ts` | Mock implementations for `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/haptics`, `@capacitor/local-notifications`, `@capacitor-community/sqlite`, and other Capacitor plugins |

## For AI Agents

### Working In This Directory
- The setup file is referenced in `vite.config.ts` under `test.setupFiles`
- When adding a new Capacitor plugin, add its mock to `mocks/capacitor.ts`
- Mocks use `vi.mock()` to intercept module imports globally

### Testing Requirements
- Mocks must match the Capacitor plugin API signatures
- Test with `bun run test:run` to verify mocks work correctly

## Dependencies

### External
- `vitest` — test runner and mocking utilities

<!-- MANUAL: -->
