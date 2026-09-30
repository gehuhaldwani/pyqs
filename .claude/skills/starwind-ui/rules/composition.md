# Component Composition

Compose from installed styled components. Local exports are authoritative for installed source;
current docs define the latest public contract.

## Contents

- framework syntax and component reuse
- roots, groups, and item nesting
- Select versus standalone Combobox
- Toast placement and imperative API
- overlay choice and accessible titles
- Card, loading Button, Tabs, and Avatar patterns

## Framework Syntax

- Astro: `class`, `for`, inline browser scripts, and static initial-state props.
- React: `className`, `htmlFor`, React event handlers, and controlled props/callbacks when needed.
- Import styled parts from the configured local component directory.
- Import imperative APIs and detail types from the matching
  `@starwind-ui/astro/<component>` or `@starwind-ui/react/<component>` package.
- Preserve `data-slot` and required `data-sw-*` hooks when editing installed internals.

## Prefer Existing Components

| Instead of                      | Use                        |
| ------------------------------- | -------------------------- |
| Custom callout                  | `alert`                    |
| Status pill                     | `badge`                    |
| Raw divider                     | `separator`                |
| Loading pulse                   | `skeleton`                 |
| Inline progress SVG             | `spinner`                  |
| Hand-rolled notification stack  | `toast` plus one `Toaster` |
| Generic bordered section        | `card` or `item`           |
| Manually joined buttons         | `button-group`             |
| Searchable Select hack          | standalone `combobox`      |
| Handwritten navigation dropdown | `navigation-menu`          |

## Keep Items Inside Groups

Use the group part when the component provides one:

| Item                             | Group           |
| -------------------------------- | --------------- |
| `SelectItem`, label, separator   | `SelectGroup`   |
| `ComboboxItem`, label, separator | `ComboboxGroup` |
| `Item`                           | `ItemGroup`     |
| `Button` cluster                 | `ButtonGroup`   |
| `InputOtpSlot`                   | `InputOtpGroup` |
| `Kbd` combination                | `KbdGroup`      |
| Related Checkbox items           | `CheckboxGroup` |
| Related Toggle items             | `ToggleGroup`   |

Avoid loose items:

```astro
<!-- Incorrect -->
<SelectContent><SelectItem value="astro">Astro</SelectItem></SelectContent>

<!-- Correct -->
<SelectContent>
  <SelectGroup><SelectItem value="astro">Astro</SelectItem></SelectGroup>
</SelectContent>
```

Read current exports for Dropdown, Context Menu, Navigation Menu, and submenu parts.

## Select And Combobox

Select is a fixed choice list. Combobox is the V3 searchable choice component. Install and use it as
its own component:

```bash
npx starwind@latest add combobox
```

```astro
---
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
} from "@/components/starwind/combobox";
---

<Combobox name="framework" defaultValue="astro">
  <ComboboxLabel>Framework</ComboboxLabel>
  <ComboboxInput id="framework" placeholder="Search frameworks" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxGroup>
      <ComboboxItem value="astro">Astro</ComboboxItem>
      <ComboboxItem value="react">React</ComboboxItem>
    </ComboboxGroup>
  </ComboboxContent>
</Combobox>
```

V3 has no `SelectSearch`. Put Select form/state props such as `name`, `required`, `disabled`,
`readOnly`, and `defaultValue` on its root. For programmatic Astro Select changes, target the
specific root with `starwind:set-value` and listen there for `starwind:value-change`. React code
uses documented controlled props/callbacks.

## Toast

Render one local styled `Toaster` in a shared application layout, not once per page or action:

```astro
---
import { Toaster } from "@/components/starwind/toast";
---

<slot />
<Toaster />
```

Import the imperative API from the matching adapter package, not the local styled folder:

```ts
import { toast } from "@starwind-ui/astro/toast";
// React file: import { toast } from "@starwind-ui/react/toast";

toast.success("Saved");
```

Confirm current `Toaster` props and toast methods from docs or package types.

## Overlay Choice And Accessibility

| Need                       | Component      |
| -------------------------- | -------------- |
| Focused modal task         | `dialog`       |
| Destructive confirmation   | `alert-dialog` |
| Side/bottom panel          | `sheet`        |
| Button action menu         | `dropdown`     |
| Pointer context actions    | `context-menu` |
| Clicked contextual content | `popover`      |
| Rich hover preview         | `hover-card`   |
| Short helper text          | `tooltip`      |

Dialog, Sheet, and Alert Dialog require their documented title part. Keep a title in the accessible
tree even when the design does not show one:

```astro
<DialogContent>
  <DialogHeader>
    <DialogTitle class="sr-only">Edit profile</DialogTitle>
  </DialogHeader>
  <!-- content -->
</DialogContent>
```

External Dialog/AlertDialog triggers use `targetId`; nested triggers need no target. Dropdown
navigation uses `DropdownLinkItem`; Context Menu remains action-only.

Runtime-managed overlay presence follows actual CSS transitions and animations. Express timing in
styles instead of an `animationDuration` prop. Preserve keyboard navigation, Escape/outside
dismissal, nested-overlay behavior, portals, and focus return.

## Common Component Shapes

Use Card parts rather than recreating a generic bordered panel:

```astro
<Card>
  <CardHeader>
    <CardTitle>Workspace</CardTitle>
    <CardDescription>Manage workspace settings.</CardDescription>
    <CardAction><Button variant="outline">Edit</Button></CardAction>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

Button has no assumed `isLoading` or `isPending` prop:

```astro
<Button disabled aria-busy="true"><Spinner /> Saving...</Button>
```

Keep Tabs and Avatar anatomy complete:

```astro
<Tabs defaultValue="account">
  <TabsList><TabsTrigger value="account">Account</TabsTrigger></TabsList>
  <TabsContent value="account">...</TabsContent>
</Tabs>

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="Ada Lovelace" />
  <AvatarFallback>AL</AvatarFallback>
</Avatar>
```

Also check:

- Give every icon-only button an accessible name.
- Use `asChild` only where current styled or Primitive docs expose it.
- Give Radio items and the Input OTP root explicit accessible names.
- Use `InputGroupButton` for actions; `InputGroupAddon` is presentational.

The composition is complete when every part is nested under its documented root/group, accessible
names and native semantics are present, and local exports plus current docs support every prop and
event used.
