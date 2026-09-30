---
name: starwind-ui
description: Manages Starwind UI v3 in Astro and React projects—initializing, migrating, adding, updating, searching, debugging, styling, theming, and composing styled components, Primitive adapters, or Runtime integrations. Use for Starwind components, starwind.config.json, Tailwind CSS v4 themes, V2-to-V3 migration, or Starwind CLI/MCP work.
allowed-tools: Bash(npx starwind@latest *), Bash(pnpx starwind@latest *), Bash(pnpm dlx starwind@latest *), Bash(yarn dlx starwind@latest *)
---

# Starwind UI v3

Starwind UI is an Astro-first, framework-portable system for Astro and React. Its normal product
surface is editable styled source installed into the application. Primitive adapters and the
framework-neutral Runtime are lower layers for projects that need more control.

Use `starwind@latest`. Current requirements are Node 22.12+, Tailwind CSS 4, Astro 5+, or React and
React DOM 18+. Vue and Svelte code in the upstream repository is private verification output, not a
public package or CLI target.

> Run CLI commands from the project root with the project's runner. Examples use
> `npx starwind@latest`; substitute `pnpm dlx`, `pnpx`, or `yarn dlx` when local files establish that
> package manager.

## Establish Project Context

Read these before changing code:

- `package.json`, `packageManager`, and lockfiles: framework, package runner, versions, scripts.
- `starwind.config.json`: config generation, primary framework, registry, component/Primitive
  destinations, installed records, Tailwind CSS, and Pro settings.
- Framework config: `astro.config.*`, Vite, Next.js, TanStack Start, or React Router files.
- The active Starwind CSS file named by config: tokens, `@theme inline`, `:root`, and `.dark`.
- Configured component directories and local `index.ts`/`index.tsx` exports: installed source and
  exact public parts.
- Nearby imports and tests: aliases, icon system, syntax, state, and event conventions.

Starwind UI v3 still writes a config with schema `config-schema.v2.json` and `version: 2`. Product
major version and config format version are different; do not "upgrade" the config number by hand.

## Choose The Right Layer

1. **Styled component first.** Use `starwind add` for ready-to-render, editable source with Starwind
   variants and composition.
2. **Primitive adapter when anatomy must be owned.** Import `@starwind-ui/astro/<name>` or
   `@starwind-ui/react/<name>`, or vendor compile-ready adapter source with
   `starwind primitives add` when the project must edit the adapter itself.
3. **Runtime for raw DOM or adapter work.** Use `@starwind-ui/runtime/<name>` or `initStarwind` only
   for plain HTML, custom adapters, or direct controller integration.

Read [layers.md](./layers.md) whenever the task uses package Primitives, vendored Primitive source,
Runtime controllers, raw HTML, or edits inside a Runtime-backed component.

## Core Rules

- Check installed source, current docs, MCP, or registry metadata before inventing UI.
- Compose existing components and documented parts before writing lookalike markup.
- Use built-in variants, semantic tokens, and documented state selectors before custom internals.
- Preserve `data-slot` as public part identity and `data-sw-*` as Runtime discovery hooks when
  editing installed component source.
- Match the file's framework: Astro uses `class`, `for`, static initial-state props, and browser
  scripts; React uses `className`, `htmlFor`, React handlers, and controlled props when appropriate.
- Read local exports and current component docs before assuming parts, props, events, or `asChild`.
- Treat styled source as application-owned; inspect diffs before replacing customized files.

## Critical Rules

These guardrails are repeated here because the root skill is the only file guaranteed to load:

- **Styling:** use built-in variants and semantic tokens before raw palette utilities or long
  appearance overrides. Use `gap-*`, `size-*`, and `truncate`; change global light/dark colors in
  the active Starwind CSS variables.
- **Forms:** preserve native `name`, submit, reset, required, disabled, and validation behavior.
  Astro uses `for`; React uses `htmlFor`. Pair invalid state with associated error text.
- **Composition:** keep items inside their documented group, give Dialog/Sheet/Alert Dialog a title,
  put `TabsTrigger` inside `TabsList`, and pair `AvatarImage` with `AvatarFallback`.
- **Loading:** Button has no assumed `isLoading` or `isPending` prop. Compose `Spinner`, `disabled`,
  and `aria-busy` after checking the installed API.
- **Icons:** reuse the project's icon system and name every icon-only control. Do not transfer
  shadcn's `data-icon` convention unless local Starwind source documents it.
- **Updates:** preview customized styled or vendored source with `--dry-run`, `--diff`, or `--view`
  before accepting replacement.

Key shapes:

```astro
<Field name="email">
  <FieldLabel>Email</FieldLabel>
  <FieldControl type="email" required />
  <FieldError match="valueMissing">Enter an email address.</FieldError>
</Field>

<Button disabled aria-busy="true"><Spinner /> Saving...</Button>
```

```astro
<DialogContent>
  <DialogHeader><DialogTitle class="sr-only">Edit profile</DialogTitle></DialogHeader>
  <!-- content -->
</DialogContent>
```

## Focused Rules

- [rules/composition.md](./rules/composition.md): component nesting, overlays, Toast, standalone
  Combobox, Card, Tabs, Avatar, and loading composition.
- [rules/forms.md](./rules/forms.md): native form participation, Field/Form, labels, defaults,
  validation, and Input Group.
- [rules/styling.md](./rules/styling.md): semantic tokens, variants, spacing, state selectors, and
  Runtime hook boundaries.
- [rules/icons.md](./rules/icons.md): framework-correct icon imports and accessible icon buttons.
- [customization.md](./customization.md): theming, dark mode initialization, variables, and safe
  component customization.

Load only the references that match the current task.

## Component Selection

| Need                   | Start with                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Action                 | `button`; `button-group` for related actions                                                                     |
| Form structure         | `form`, `field`, `fieldset`, `label`                                                                             |
| Text and choice input  | `input`, `textarea`, `input-group`, `checkbox`, `checkbox-group`, `radio-group`, `switch`, `slider`, `input-otp` |
| Fixed choice list      | `select` or `native-select`                                                                                      |
| Searchable choice      | standalone `combobox`; V3 has no `SelectSearch`                                                                  |
| Navigation             | `navigation-menu`, `sidebar`, `breadcrumb`, `tabs`, `pagination`                                                 |
| Overlays               | `dialog`, `sheet`, `alert-dialog`, `popover`, `dropdown`, `context-menu`, `hover-card`, `tooltip`                |
| Feedback               | `toast`, `alert`, `progress`, `skeleton`, `spinner`                                                              |
| Data and content       | `table`, `card`, `badge`, `avatar`, `item`, `kbd`, `prose`                                                       |
| Rich input/media       | `color-picker`, `dropzone`, `image`, `video`, `carousel`                                                         |
| Disclosure and toggles | `accordion`, `collapsible`, `toggle`, `toggle-group`                                                             |

Confirm availability for the configured framework before installing. The styled `image` component
is Astro-only.

## Current Docs And Commands

For exact APIs, read current docs or installed source:

```bash
npx starwind@latest docs button dialog combobox --json
npx starwind@latest search combobox --json
```

Prefer Starwind MCP when available, then per-page Markdown, `llms.txt`, `llms-full.txt`, and
`ai-manifest.json`. See [mcp.md](./mcp.md) for source priority and fallbacks.

Common V3 commands:

```bash
npx starwind@latest init --framework astro
npx starwind@latest init --framework react
npx starwind@latest add button dialog combobox
npx starwind@latest update button --dry-run
npx starwind@latest update button --diff
npx starwind@latest primitives add button --framework react
npx starwind@latest primitives list --framework all
npx starwind@latest migrate
```

Use only flags documented in [cli.md](./cli.md).

## Working Sequence

1. Establish framework, package runner, current config shape, destinations, installed records, and
   local validation commands.
2. Choose styled, Primitive, or Runtime from the layer ladder.
3. Confirm the component and API from installed source plus current docs.
4. Install missing source with the exact framework and destination intended by the config.
5. Read every added or replaced file before wiring it into the application.
6. Compose through local exports and framework syntax; preserve Runtime hooks and native semantics.
7. Run the narrowest relevant format, typecheck, build, tests, and browser checks.

The task is complete when every import resolves from the intended framework/destination, generated
or edited source matches current documented contracts, and relevant validation passes or each
remaining failure is reported.

## Updates And Migration

`update` can replace locally edited styled or vendored Primitive source. Preview first:

```bash
npx starwind@latest update button --dry-run
npx starwind@latest update button --diff
npx starwind@latest update button --view
```

Use `--all` or `--overwrite` only when the requested scope is explicit and local changes are
recoverable.

For a pre-Runtime Astro project, read [v3-migration.md](./v3-migration.md) before running
`starwind migrate`. Migration success means the report, remaining legacy entries, application API
changes, and behavioral checks are all accounted for—not merely that the command exited.

## References

- [cli.md](./cli.md): complete V3 CLI surface and ownership cautions
- [layers.md](./layers.md): styled, Primitive, vendored source, and Runtime boundaries
- [v3-migration.md](./v3-migration.md): V2 Astro to V3 Runtime migration runbook
- [customization.md](./customization.md): tokens, dark mode, and safe customization
- [shadcn-migration.md](./shadcn-migration.md): shadcn-style theme token mapping only
- [mcp.md](./mcp.md): live Starwind tools and AI-readable docs
