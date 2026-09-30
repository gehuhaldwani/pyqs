# Starwind CLI v3 Reference

Run commands from the project root. Examples use `npx starwind@latest`; use the runner established by
the project's package manager.

| Package manager | Runner                                               |
| --------------- | ---------------------------------------------------- |
| npm             | `npx starwind@latest`                                |
| pnpm            | `pnpm dlx starwind@latest` or `pnpx starwind@latest` |
| Yarn            | `yarn dlx starwind@latest`                           |

The public framework targets are `astro` and `react`. `all` is accepted only by commands that
explicitly document it. Vue and Svelte are not public CLI targets.

## Contents

- `init` and legacy migration
- styled `add`, `update`, and `remove`
- framework targeting
- vendored `primitives add`, `update`, and `list`
- component and Pro `search`
- documentation lookup
- Pro setup
- registry and command boundaries

## `init`

Creates the current `starwind.config.json`, selects Astro or React, installs the matching adapter,
creates Starwind CSS, and configures project integration and aliases.

```bash
npx starwind@latest init
npx starwind@latest init --framework astro
npx starwind@latest init --framework react
npx starwind@latest init --defaults
npx starwind@latest init --pro
```

| Flag                       | Meaning                              |
| -------------------------- | ------------------------------------ |
| `-d, --defaults`           | Accept default prompts.              |
| `-p, --pro`                | Initialize and configure Pro access. |
| `--framework astro\|react` | Select the public framework target.  |
| `--astro`                  | Astro shortcut.                      |
| `--react`                  | React shortcut.                      |

Choose one framework selector. If `init` finds a legacy config, it can offer the migration flow.

## `migrate`

Migrates a pre-Runtime Astro copied-component project. It migrates all safe registered components in
one run and does not accept component names.

```bash
npx starwind@latest migrate
npx starwind@latest migrate --yes --package-manager pnpm
```

| Flag                                    | Meaning                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| `-y, --yes`                             | Skip prompts; creates a backup and overwrites registered conflicts. |
| `-m, --package-manager npm\|pnpm\|yarn` | Select dependency runner.                                           |

Use the interactive command by default. Read [v3-migration.md](./v3-migration.md) before running it;
`--yes` belongs only on a clean, recoverable worktree.

## `add`

Adds Runtime-backed styled component source for the configured framework. With no names it opens an
interactive picker.

```bash
npx starwind@latest add button dialog combobox
npx starwind@latest add button --framework react
npx starwind@latest add --all
npx starwind@latest add @starwind-pro/hero-01 button
```

| Flag                                    | Meaning                                                    |
| --------------------------------------- | ---------------------------------------------------------- |
| `-a, --all`                             | Add every available uninstalled styled component in scope. |
| `-y, --yes`                             | Skip confirmation prompts.                                 |
| `-o, --overwrite`                       | Replace files that already exist.                          |
| `--framework astro\|react`              | Override the styled target.                                |
| `--registry <registry>`                 | Use a remote registry URL or local registry file.          |
| `-m, --package-manager npm\|pnpm\|yarn` | Select dependency runner.                                  |

The CLI resolves component dependencies and package requirements. Use exact Pro block commands from
current search/docs/MCP results. Inspect every created or overwritten file.

## `update`

Refreshes installed styled source and can overwrite local changes. With no names it opens an
installed-component picker for the selected framework.

```bash
npx starwind@latest update button --dry-run
npx starwind@latest update button --diff
npx starwind@latest update button --view
npx starwind@latest update button --diff src/components/starwind/button/variants.ts
npx starwind@latest update button --view src/components/starwind/button/Button.astro
npx starwind@latest update --all --framework all
```

| Flag                                    | Meaning                                           |
| --------------------------------------- | ------------------------------------------------- |
| `-a, --all`                             | Update every installed component in scope.        |
| `-y, --yes`                             | Skip confirmation prompts.                        |
| `--dry-run`                             | Plan changes without writing files.               |
| `--diff [path]`                         | Show all planned diffs or one planned path.       |
| `--view [path]`                         | Show all new file contents or one planned path.   |
| `--framework astro\|react\|all`         | Select one or every configured styled target.     |
| `--registry <registry>`                 | Use a remote registry URL or local registry file. |
| `-m, --package-manager npm\|pnpm\|yarn` | Select package updates.                           |

Preview customized components first. Use `--all` only when every installed component in the chosen
framework scope is intended.

## Framework Targeting

The framework chosen by `init` is primary and normally writes to `componentDir`. A project that
intentionally owns Astro and React styled source side by side can use framework overrides; additional
destinations are recorded under `componentDirs.<framework>`.

```bash
npx starwind@latest add button --framework react
npx starwind@latest update button --framework react
npx starwind@latest remove button --framework react
```

A framework flag selects generated source and destination. It does not convert application code
between frameworks.

## `primitives`

Use this namespace only when the project needs compile-ready Primitive adapter source copied into the
repository. Normal package-based Primitives come from `@starwind-ui/astro` or
`@starwind-ui/react` and do not need vendoring.

### Add

```bash
npx starwind@latest primitives add button checkbox
npx starwind@latest primitives add button --framework react --to src/react-primitives
npx starwind@latest primitives add --all
```

| Flag                                    | Meaning                           |
| --------------------------------------- | --------------------------------- |
| `-a, --all`                             | Add all available Primitives.     |
| `-y, --yes`                             | Skip confirmation prompts.        |
| `-o, --overwrite`                       | Replace existing Primitive files. |
| `--framework astro\|react`              | Select the adapter source target. |
| `--to <dir>`                            | Set the destination.              |
| `-p, --path <dir>`                      | Alias for `--to`.                 |
| `-m, --package-manager npm\|pnpm\|yarn` | Select dependency runner.         |

### Update

```bash
npx starwind@latest primitives update button --dry-run
npx starwind@latest primitives update button --diff
npx starwind@latest primitives update --all --framework react
```

`primitives update` supports `--all`, `--yes`, `--dry-run`, `--diff [path]`, `--view [path]`,
`--framework astro|react`, and `--package-manager`. It can overwrite locally customized vendored
source; preview and review it like styled source.

### List

```bash
npx starwind@latest primitives list
npx starwind@latest primitives list --framework all --json
```

`primitives list` supports `--framework astro|react|all` and `--json`.

There is no Primitive remove/export command, Runtime source eject/add command,
`starwind add --primitives`, or `starwind update --primitives`.

## `search`

Searches styled components and Pro blocks; `--primitives` switches to Primitive source discovery.

```bash
npx starwind@latest search combobox --json
npx starwind@latest search hero --plan free --limit 5
npx starwind@latest search button --primitives --framework react
```

| Flag                            | Meaning                                              |
| ------------------------------- | ---------------------------------------------------- |
| `-p, --plan free\|pro`          | Filter Pro results.                                  |
| `-c, --category <category>`     | Filter Pro category.                                 |
| `-l, --limit <number>`          | Limit results; defaults to 20 and caps at 50.        |
| `-o, --offset <number>`         | Offset paginated results.                            |
| `--json`                        | Print structured output.                             |
| `--registry <registry>`         | Search a remote registry URL or local registry file. |
| `--primitives`                  | Search Primitive source.                             |
| `--framework astro\|react\|all` | Scope Primitive search.                              |

## `docs`

Opens or returns references for one or more styled components.

```bash
npx starwind@latest docs button dialog
npx starwind@latest docs combobox --json
```

`docs` supports `--json` and `--registry <registry>`. A URL result is a pointer: read the page or
its Markdown alternate before implementing an API.

## `remove`

Deletes installed styled source and updates config. Search application imports before removal.

```bash
npx starwind@latest remove button
npx starwind@latest remove button --framework react
npx starwind@latest remove --all --framework all
```

`remove` supports `--all`, `--yes`, and `--framework astro|react|all`. Use `--all` only when
the entire chosen scope is intended.

## `setup`

Configures Starwind Pro for an initialized project.

```bash
npx starwind@latest setup
npx starwind@latest setup --pro
npx starwind@latest setup --yes --package-manager pnpm
```

`setup` supports `--pro` (currently the default task), `--yes`, and `--package-manager`. It
writes authorization configuration to `starwind.config.json`, creates or updates `.env.local`,
and ensures the environment file is ignored. Never expose the license value.

## Registry Safety And Provenance

`--registry` can point to a local registry file or remote registry URL. Treat a non-bundled
registry as executable source input: inspect its origin and generated files before accepting them.

- Do not send Pro authorization headers or `STARWIND_LICENSE_KEY` to an untrusted origin.
- Keep local registry paths inside the intended project/repository boundary.
- Preserve the registry recorded for installed components in `starwind.config.json`; it identifies
  the source an update should compare against.
- Preview an update from the same intended registry before overwriting locally owned source.
- Do not transplant shadcn registry addresses, schemas, or package conventions into Starwind.

## Command Boundaries

Do not transfer shadcn commands into Starwind. Starwind has no top-level `info`, `apply`, `build`,
or `create` command. Preview is expressed by `update --dry-run|--diff|--view`, while vendored
Primitive management stays under `starwind primitives`.

When local CLI output and this reference differ, prefer the installed/current CLI for flags and
current Starwind docs for public behavior, then update the skill rather than guessing.
