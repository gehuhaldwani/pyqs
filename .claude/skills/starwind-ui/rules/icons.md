# Icons

Use the project's existing icon system. Check `package.json`, nearby imports, framework, and local
component source before adding a dependency.

## Astro

Prefer the Astro-compatible import style already in the project. Starwind examples commonly use SVG
subpath imports:

```astro
---
import Search from "@tabler/icons/outline/search.svg";
import { Button } from "@/components/starwind/button";
---

<Button size="icon" aria-label="Search">
  <Search />
</Button>
```

## React

Use the project's React icon package and import shape:

```tsx
import { Search } from "lucide-react";
import { Button } from "@/components/starwind/button";

export function SearchButton() {
  return (
    <Button size="icon" aria-label="Search">
      <Search />
    </Button>
  );
}
```

The package above is an example, not a default. Preserve the installed icon system.

## Do Not Transfer Shadcn Icon Conventions

Starwind styled components commonly size SVG children with selectors such as
`[&_svg:not([class*='size-'])]`. Let that contract size ordinary Button, Badge, Toggle, Input Group,
and menu icons.

```astro
<!-- Incorrect: copied shadcn metadata plus an unnecessary size override. -->
<Button>
  <Search data-icon="inline-start" class="size-4" />
  Search
</Button>

<!-- Correct: Starwind's component variant owns the ordinary icon size. -->
<Button>
  <Search />
  Search
</Button>
```

Do not add `data-icon="inline-start"` or `data-icon="inline-end"` merely because a shadcn example
uses it. Add metadata or a size class only when the installed Starwind component or requested design
has a documented reason. Standalone icons outside a sizing component can use `size-*` normally.

## Accessible Icon Buttons

An icon-only control needs a programmatic name and a documented icon-button size:

```astro
<Button size="icon-sm" aria-label="Open settings">
  <Settings />
</Button>
```

Do not use `title` as the only accessible name. If visible text exists, it normally supplies the
name; decorative SVGs should not introduce a competing label.

## Checks

- Plain Astro files do not import React-only icon components.
- Existing package icons are reused instead of duplicating inline SVG.
- Common SVG children inherit component sizing unless a documented exception is intended.
- Icon-only controls have an accessible name.
- Added blocks are adapted to the project's icon library when that can be done without changing
  meaning or behavior.

The icon change is complete when it builds in the file's framework, matches local imports and sizing
contracts, and every interactive icon has a programmatic name.
