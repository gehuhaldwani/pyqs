# Styling And Customization Rules

Use [customization.md](../customization.md) for global theming, color variables, radius, and dark-mode
initialization.

## Contents

- styling priority
- semantic and status tokens
- built-in variants and call-site classes
- Tailwind spacing, sizing, and truncation
- global light/dark theming
- reusable `tailwind-variants`
- public selectors, Runtime hooks, and overlay presence

## Priority

Choose the first layer that expresses the request:

1. documented component prop or variant;
2. semantic Tailwind token;
3. documented state or `data-slot` selector;
4. scoped layout/appearance class;
5. local styled-component source edit.

When editing installed internals, preserve `data-slot`, required `data-sw-*` discovery hooks,
framework adapter wiring, and Runtime behavior.

## Semantic Tokens

Use tokens such as `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`,
`bg-primary`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`,
`border-input`, and `outline-outline`.

```astro
<!-- Incorrect: fixed palette colors bypass the theme. -->
<section class="border-gray-200 bg-white text-gray-950">
  <p class="text-slate-500">Secondary text</p>
</section>

<!-- Correct: semantic utilities follow :root and .dark. -->
<section class="border-border bg-background text-foreground">
  <p class="text-muted-foreground">Secondary text</p>
</section>
```

## Status And State

Use documented status variants and token pairs before raw green/red/yellow/blue utilities:

```astro
<!-- Incorrect -->
<span class="rounded-full bg-red-100 px-2 text-red-700">Failed</span>

<!-- Correct -->
<Badge variant="error">Failed</Badge>
<span class="text-success">+20.1%</span>
```

Common semantic families are `info`, `success`, `warning`, and `error`, each with a foreground
partner in the theme. Verify the local variant file before assuming a component exposes every
status variant.

## Variants Before Utility Reconstruction

Use the component API instead of rebuilding it at the call site:

```astro
<!-- Incorrect -->
<Button class="border border-input bg-transparent text-foreground hover:bg-accent">Cancel</Button>

<!-- Correct -->
<Button variant="outline" size="sm">Cancel</Button>
```

Use `class` in Astro and `className` in React for layout and narrow exceptions such as `max-w-md`,
`mx-auto`, `mt-4`, grid placement, or a deliberate one-off radius. Do not hide a new visual variant
inside a long call-site class string.

```astro
<!-- Incorrect -->
<Badge class="bg-green-100 text-green-700">Active</Badge>

<!-- Correct -->
<Badge variant="success">Active</Badge>
```

## Tailwind Conventions

Prefer the concise Tailwind form:

```astro
<!-- Incorrect -->
<div class="flex space-x-2">
  <Skeleton class="h-10 w-10 rounded-full" />
  <p class="overflow-hidden text-ellipsis whitespace-nowrap">Long project name</p>
</div>

<!-- Correct -->
<div class="flex gap-2">
  <Skeleton class="size-10 rounded-full" />
  <p class="truncate">Long project name</p>
</div>
```

- Replace vertical `space-y-*` with `flex flex-col gap-*` or grid and `gap-*` in new layouts.
- Use `size-*` only when width and height are equal.
- Use `truncate` for a single line; use line clamp or intentional wrapping for multiple lines.
- Preserve responsive, container-query, motion, and reduced-motion behavior during customization.

## Global Light And Dark Themes

Do not scatter manual palette pairs across components when the colors represent the global theme:

```astro
<!-- Incorrect -->
<main class="bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50">...</main>

<!-- Correct -->
<main class="bg-background text-foreground">...</main>
```

Change `:root` and `.dark` in the active Starwind CSS file named by `starwind.config.json`. A local
`dark:` utility remains appropriate for a deliberate component-specific behavior that is not a
global semantic color replacement.

## Reusable Variants

Follow the installed source's `tailwind-variants` pattern for reusable conditional styles. Do not
assume a shadcn-style `cn()` helper exists.

```ts
import { tv } from "tailwind-variants";

export const item = tv({
  base: "flex items-center gap-2 rounded-md",
  variants: {
    active: {
      true: "bg-primary text-primary-foreground",
      false: "bg-muted text-muted-foreground",
    },
  },
  defaultVariants: { active: false },
});
```

```astro
<div class={item({ active: isActive })}>...</div>
```

Use a plain class string for one-off layout. Add or edit a variant when the state recurs or belongs
to the component's public styling API.

## Public And Internal Selectors

Use `data-slot` for public part styling and documented state attributes for stateful styles:

```css
[data-slot="combobox-item"][data-highlighted] {
  /* state styling */
}
```

Useful state contracts can include `data-state`, `data-open`, `data-closed`, `data-checked`,
`data-highlighted`, `data-starting-style`, and `data-ending-style`; confirm the exact component
contract first.

Attributes beginning with `data-sw-*` are primarily Runtime discovery/behavior hooks. Preserve
them, while preferring public slots/state for application CSS. Legacy `.starwind-*` implementation
classes are not a stable V3 styling contract.

## Presence, Animation, And Stacking

Runtime-managed overlays observe actual CSS animations and transitions. Define entrance/exit timing
through Tailwind or CSS and documented presence states. An `animationDuration` prop is not the V3
synchronization mechanism.

Let Dialog, Sheet, Alert Dialog, Dropdown, Context Menu, Popover, Tooltip, Hover Card, and Select
content own their stacking. Inspect the installed source and local stacking context before adding a
manual `z-*` override.

A styling change is complete when it follows the local framework syntax, uses the narrowest public
styling surface, keeps semantic light/dark behavior, and preserves every Runtime hook in edited
source.
