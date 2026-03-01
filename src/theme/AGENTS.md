<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-28 | Updated: 2026-02-28 -->

# theme

## Purpose
Ionic CSS custom property overrides for Dash's visual theming.

## Key Files

| File | Description |
|------|-------------|
| `variables.css` | Ionic CSS custom properties — primary color palette, dark mode overrides, and component-level style customizations |

## For AI Agents

### Working In This Directory
- Use Ionic CSS variables (e.g., `--ion-color-primary`, `--ion-background-color`) — never hardcode colors
- Dark mode is handled automatically via `@media (prefers-color-scheme: dark)` in Ionic's `palettes/dark.system.css`
- Custom overrides here apply on top of Ionic defaults
- Test all color changes in both light and dark modes

### Common Patterns
- Define stepped color shades (e.g., `--ion-color-primary-shade`, `--ion-color-primary-tint`)
- Use RGB variants for opacity support (e.g., `--ion-color-primary-rgb`)

## Dependencies

### External
- `@ionic/vue/css/palettes/dark.system.css` — base dark mode palette

<!-- MANUAL: -->
