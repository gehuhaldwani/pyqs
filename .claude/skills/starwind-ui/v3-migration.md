# Migrating Legacy Astro Projects To Starwind UI v3

Use this runbook only for a pre-Runtime Astro project with the legacy copied-component config. React
is a new V3 target, not an input to `starwind migrate`.

## Contents

- pre-migration baseline and recovery
- interactive and noninteractive commands
- migration report review
- application API replacements
- behavioral verification

## Before The Command

1. Inspect Git status and account for every existing change.
2. Confirm Node 22.12+, Astro 5+, Tailwind CSS 4, the package manager, and the legacy
   `starwind.config.json`.
3. Locate the configured component directory and note customized Starwind folders, application
   scripts, CSS selectors, tests, and analytics that depend on component internals.
4. Run the project's build, typecheck, and relevant tests; record every pre-existing failure.

Use a clean, recoverable branch or commit. The CLI backup protects the component directory, while Git
also protects application code outside it.

## Run Interactively

```bash
npx starwind@latest migrate
```

The command:

- detects the legacy config and public component directory;
- offers a copy such as `src/components/starwind-legacy`, using a numbered suffix if needed;
- replaces approved registered conflicts with Runtime-backed styled source and package requirements;
- leaves unrelated custom folders alone;
- writes the current config shape with `framework: "astro"`;
- keeps unresolved entries recorded with `source: "legacy"`; and
- can offer registry-declared import/export rename codemods.

It migrates all safe components and accepts no component names. Existing public imports normally
remain under `@/components/starwind/<name>`.

Use noninteractive mode only when the worktree is clean and recoverable:

```bash
npx starwind@latest migrate --yes --package-manager pnpm
```

`--yes` accepts the backup and overwrites registered conflicts. Retain the backup through final
behavioral verification.

## Read The Migration Report

Account for every category before touching application integrations:

- **Migrated:** Runtime-backed styled components installed.
- **Skipped:** conflicts left untouched.
- **Backed up:** copied legacy component directory.
- **Custom:** folders not owned by the registry.
- **Legacy:** config entries still using old source.
- **Rename codemods:** applied, skipped, or approved with no matching usage.

A successful process exit with unexplained skipped or legacy entries is an incomplete migration.

## Application API Review

Search for each old pattern, inspect each match, and compare it with current component docs. Apply a
replacement only where the application actually used the old contract.

| Legacy integration                                                  | V3 direction                                                                                                                      |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Inline Theme Toggle helper                                          | Put `ThemeInitScript` from `@starwind-ui/astro/theme` in the shared `<head>`; use `initThemeController` for programmatic changes. |
| `theme:change` listeners                                            | Use `starwind:theme-change` for new listeners.                                                                                    |
| `starwind-select:change`, `starwind-switch:change`, `slider-change` | Use the documented Runtime event, commonly `starwind:value-change` or `starwind:checked-change`, on the component root.           |
| Global `starwind-select:select` dispatch                            | Dispatch `starwind:set-value` to the intended Select root.                                                                        |
| Local styled event-detail types                                     | Import current detail types from `@starwind-ui/astro/<component>`.                                                                |
| `SelectSearch`                                                      | Use the standalone Combobox and its documented parts.                                                                             |
| `toast` from the local styled folder                                | Keep local `Toaster`; import imperative `toast` from `@starwind-ui/astro/toast`.                                                  |
| Local `initCarousel` / manager APIs                                 | Use `createCarousel` from `@starwind-ui/astro/carousel`; set `autoInit={false}` for manual initialization.                        |
| External Dialog/AlertDialog trigger `for`                           | Use `targetId`; nested triggers need no target.                                                                                   |
| Overlay `animationDuration`                                         | Express timing in CSS; Runtime observes actual transitions/animations.                                                            |
| Astro interactive `checked`                                         | Express initial state with `defaultChecked`; use Runtime APIs/events for later changes.                                           |
| Astro Select initial state                                          | Put `defaultValue`, `name`, `required`, `readOnly`, and `disabled` on the Select root.                                            |
| Astro NativeSelect `defaultValue`                                   | Use native `selected` option semantics.                                                                                           |
| `DropdownItem as="a"`                                               | Use `DropdownLinkItem`; Context Menu remains action-only.                                                                         |
| Old Color Picker `element.setValue()`                               | Use `createColorPicker` and current Runtime value events.                                                                         |
| `.starwind-*` implementation selectors                              | Prefer `data-slot` and documented state attributes such as `data-state`, `data-checked`, and `data-highlighted`.                  |

Also audit removed default/namespace members such as `Select.Search`, `Carousel.init`, and
`Toast.Manager`. Inspect local styled exports and the matching `@starwind-ui/astro/<component>`
entry point when an import or event type no longer resolves.

Port deliberate visual or composition customizations from the backup into V3 source. Restoring an
entire old folder or its behavior script reintroduces the implementation the Runtime replaces.

## Behavioral Verification

After migration, rerun the recorded format, build, typecheck, and test commands. Then exercise:

- first paint, light/dark/system theme changes, and Astro client-side navigation;
- submit and reset for Checkbox, Switch, Select, Native Select, Radio Group, Input OTP, Combobox, and
  Color Picker;
- overlay triggers, Escape, outside interaction, nested overlays, and focus return;
- programmatic Select, Color Picker, Carousel, Theme, and Toast integrations;
- event listeners for one delivery, correct detail, and the intended root;
- customized layouts at narrow and wide viewports; and
- CSS, tests, or analytics that previously queried legacy DOM/classes.

Migration is complete only when the report is fully understood, remaining `source: "legacy"` entries
are intentional, application integrations use current contracts, and relevant static and browser
checks pass. Keep the backup until then.

Primary guides:

- https://starwind.dev/docs/getting-started/migration/
- https://starwind.dev/blog/migrating-to-starwind-ui-v3/
