# Starwind v3 Layers

Read this reference when a task goes below the normal styled-component surface.

## Contents

- layer decision table
- styled source
- package Primitive adapters
- vendored Primitive source
- Runtime and raw HTML
- public and internal contract boundaries

## Decision Table

| Layer              | Use when                                                                                               | Ownership                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Styled component   | The app needs polished UI and editable variants/markup.                                                | Source is copied into the app; Runtime behavior remains a package dependency.                  |
| Primitive package  | The app needs unstyled framework-native anatomy and behavior.                                          | App owns composition/styles; `@starwind-ui/astro` or `@starwind-ui/react` owns adapter source. |
| Vendored Primitive | The app must edit the framework adapter itself.                                                        | Compile-ready adapter source is copied into the app and tracked by config.                     |
| Runtime/raw HTML   | The app renders its own DOM contract, builds an adapter, or integrates without Astro/React components. | App owns markup and lifecycle integration; `@starwind-ui/runtime` owns controllers.            |

Styled component names and Primitive names are related but not guaranteed to match one-to-one. A
styled component can combine, rename, or omit a Primitive foundation. Confirm the component page's
Behavior Foundation before moving between layers.

## Styled Source

Use the CLI for the normal path:

```bash
npx starwind@latest add dialog
```

Import through the configured application alias:

```astro
---
import { Dialog, DialogContent } from "@/components/starwind/dialog";
---
```

```tsx
import { Dialog, DialogContent } from "@/components/starwind/dialog";
```

The local `index.ts` or `index.tsx` is authoritative for installed exports. Customize variants,
Tailwind classes, wrapper markup, and composition locally while preserving the adapter contract.

## Primitive Packages

Initialized projects normally already have the adapter matching their primary framework.

```astro
---
import Button from "@starwind-ui/astro/button";
---

<Button.Root type="button">Save</Button.Root>
```

```tsx
import Button from "@starwind-ui/react/button";

export function SaveButton() {
  return <Button.Root type="button">Save</Button.Root>;
}
```

Use the framework package matching the file being authored. Read the current Primitive API page for
parts, props, events, controlled-state differences, and Runtime links.

## Vendored Primitive Source

Use vendoring only when application ownership of adapter implementation is an actual requirement:

```bash
npx starwind@latest primitives add button --framework react
npx starwind@latest primitives update button --dry-run
```

Config tracks the framework, destination, and installed Primitive versions. `primitives update` can
replace local edits, so preview and review it. Vendored adapter source is different from styled
source; keep it in `primitiveDir` or `primitiveDirs.<framework>`, not the styled component folder.

## Runtime And Raw HTML

Direct controllers use component subpaths:

```ts
import { createSelect } from "@starwind-ui/runtime/select";

const instance = createSelect(root);
instance.destroy();
```

Raw HTML discovery can initialize at an application root:

```ts
import { initStarwind } from "@starwind-ui/runtime/init-starwind";

const runtime = initStarwind(document);
runtime.destroy();
```

Own lifecycle cleanup. Use the exact DOM contract, command events, detail types, and initialization
rules from current Runtime/Primitive docs.

## Contract Boundaries

- Runtime owns shared DOM behavior, state, events, focus, forms, overlays, timers, and cleanup.
- Framework adapters connect props, refs, events, lifecycle, and markup to Runtime.
- Styled components own Starwind composition, defaults, variants, icons, classes, and slots.
- `data-slot` is the public part identity and the normal visual customization hook.
- `data-sw-*` attributes are required Runtime behavior/discovery hooks; preserve them, but prefer
  public slots and documented state attributes for app styling.
- Preserve native form participation and Runtime-managed keyboard, focus, dismissal, portal, and
  cleanup behavior when changing local source.

The lower-layer task is complete when the chosen layer is intentional, imports use the matching
framework package, lifecycle cleanup is handled, and all required Runtime hooks remain intact.
