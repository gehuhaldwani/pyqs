# Customization And Theming

Starwind styled components use semantic CSS variables registered with Tailwind CSS 4. Global design
changes belong in the active CSS file from `starwind.config.json`, not a second theme file.

## Contents

- token flow and semantic color variables
- border radius
- dark-mode initialization
- changing and adding semantic tokens
- styled-component variants and wrappers
- checking styled and vendored-source updates

## Token Flow

1. `:root` defines light values and `.dark` defines dark values.
2. `@theme inline` maps them to Tailwind utilities.
3. Styled components use utilities such as `bg-primary`, `text-muted-foreground`, and
   `border-border`.
4. Changing a semantic variable updates every component that consumes it.

Preserve existing `@theme inline`, `:root`, `.dark`, sidebar/status tokens, radii, keyframes, and
component-specific variables.

## Color Variables

Starwind uses the `name` / `name-foreground` convention. The base variable is for backgrounds,
fills, borders, or actions. The `-foreground` variable is for readable text or icons on that
background.

| Variable                                 | Purpose                                           |
| ---------------------------------------- | ------------------------------------------------- |
| `--background` / `--foreground`          | Page background and default text                  |
| `--card` / `--card-foreground`           | Card surfaces                                     |
| `--popover` / `--popover-foreground`     | Popovers, tooltips, selects, and menus            |
| `--primary` / `--primary-foreground`     | Primary buttons and actions                       |
| `--secondary` / `--secondary-foreground` | Secondary actions                                 |
| `--primary-accent`, `--secondary-accent` | Brand text colors readable on the page background |
| `--muted` / `--muted-foreground`         | Muted surfaces and quiet text                     |
| `--accent` / `--accent-foreground`       | Hover and selected states                         |
| `--info` / `--info-foreground`           | Informational states                              |
| `--success` / `--success-foreground`     | Successful states                                 |
| `--warning` / `--warning-foreground`     | Warning states                                    |
| `--error` / `--error-foreground`         | Error and destructive states                      |
| `--border`                               | Default border color                              |
| `--input`                                | Form input borders                                |
| `--outline`                              | Focus outline color                               |
| `--radius`                               | Global radius seed                                |
| `--sidebar-*`                            | Sidebar-specific colors                           |

Default themes commonly reference Tailwind CSS 4 palette variables such as
`var(--color-blue-700)`. Follow the active file when it uses OKLCH, hex, `rgb()`, or another valid
CSS color format.

## Border Radius

`--radius` is the global seed. Starwind registers a complete Tailwind radius scale from it:

| Token          | Value                            |
| -------------- | -------------------------------- |
| `--radius-xs`  | `calc(var(--radius) - 0.375rem)` |
| `--radius-sm`  | `calc(var(--radius) - 0.25rem)`  |
| `--radius-md`  | `calc(var(--radius) - 0.125rem)` |
| `--radius-lg`  | `var(--radius)`                  |
| `--radius-xl`  | `calc(var(--radius) + 0.25rem)`  |
| `--radius-2xl` | `calc(var(--radius) + 0.5rem)`   |
| `--radius-3xl` | `calc(var(--radius) + 1rem)`     |

Change `--radius` for a system-wide adjustment. Use a local class such as `rounded-full` only for a
deliberate exception.

## Dark Mode Initialization

Starwind uses the `.dark` class and the shared Runtime theme controller. Render `ThemeInitScript`
in the document head so saved/system preference is applied before paint.

Astro:

```astro
---
import { ThemeInitScript } from "@starwind-ui/astro/theme";
---

<head>
  <ThemeInitScript />
</head>
```

React framework document/root:

```tsx
import { ThemeInitScript } from "@starwind-ui/react/theme";

export function DocumentHead() {
  return (
    <head>
      <ThemeInitScript />
    </head>
  );
}
```

Place it through the host framework's documented server-rendered head mechanism. For programmatic
changes, import `initThemeController` from the matching adapter package and listen for
`starwind:theme-change`.

Remove a legacy inline localStorage/theme helper during V3 migration so two controllers do not race.
The legacy `theme:change` event may exist for compatibility, but new integrations use the Runtime
event.

## Change Existing Tokens

Follow the active file's value style:

```css
:root {
  --primary: var(--color-emerald-700);
  --primary-foreground: var(--color-white);
  --primary-accent: var(--color-emerald-800);
}

.dark {
  --primary: var(--color-emerald-500);
  --primary-foreground: var(--color-neutral-950);
  --primary-accent: var(--color-emerald-300);
}
```

Keep component usage semantic:

```astro
<Button variant="primary">Save changes</Button>
```

## Add A Semantic Color

Register the utility and define both modes in the same active CSS file:

```css
@theme inline {
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
}

:root {
  --brand: var(--color-blue-700);
  --brand-foreground: var(--color-white);
}

.dark {
  --brand: var(--color-blue-500);
  --brand-foreground: var(--color-neutral-950);
}
```

Use the registered utilities with the current framework's attribute syntax:

```astro
<div class="bg-brand text-brand-foreground">Brand surface</div>
```

```tsx
<div className="bg-brand text-brand-foreground">Brand surface</div>
```

Starwind uses Tailwind CSS 4. Add Tailwind v3 config only when the host project intentionally carries
a separate legacy setup.

## Customize A Styled Component

See [rules/styling.md](./rules/styling.md) for semantic-token, state-selector, spacing, and component
override rules.

Use this order:

1. Existing variant or prop.
2. Semantic token.
3. Layout/scoped class at the call site.
4. New local variant following the installed `tailwind-variants` pattern.
5. Wrapper composition.
6. Direct local styled-source edit.

To add a reusable variant, edit the installed component's `variants.ts` and follow its existing
`tailwind-variants` shape:

```ts
variant: {
  brand: "bg-brand text-brand-foreground hover:bg-brand/90 focus-visible:ring-brand/50",
}
```

For repeated composition, make a framework-native wrapper instead of duplicating markup. Astro
example:

```astro
---
import { Alert, AlertDescription, AlertTitle } from "@/components/starwind/alert";

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<Alert>
  <AlertTitle>{title}</AlertTitle>
  <AlertDescription><slot /></AlertDescription>
</Alert>
```

Use the same composition with typed props and `children` in React.

For source edits, preserve framework adapter imports, `data-slot`, required `data-sw-*` hooks,
public exports, native semantics, and documented Runtime state attributes.

## Checking For Updates

Styled source belongs to the application, but an update can replace it. Preview before accepting
upstream changes:

```bash
npx starwind@latest update button --dry-run
npx starwind@latest update button --diff
npx starwind@latest update button --view
```

Vendored Primitive source has the same ownership risk. Preview it through its own namespace:

```bash
npx starwind@latest primitives update button --dry-run
npx starwind@latest primitives update button --diff
```

A customization is complete when light/dark values remain readable, the theme initializes without a
wrong-theme flash, local variants still typecheck, and Runtime behavior survives the edit.
