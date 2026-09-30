# Starwind MCP And AI Sources

The published MCP package is `@starwind-ui/mcp`:

```bash
npx -y @starwind-ui/mcp
```

It gives compatible assistants V3-layered docs and search, validated init/add/migrate commands,
Astro/React targeting, package-manager detection, and local project-context inspection. It
complements direct project inspection; even with `cwd`, it does not know unsaved component
customizations or application conventions.

## Setup

Codex example:

```toml
[mcp_servers.starwind_ui]
command = "npx"
args = ["-y", "@starwind-ui/mcp"]
enabled = true
```

Generic JSON client example:

```json
{
  "mcpServers": {
    "starwind-ui": {
      "command": "npx",
      "args": ["-y", "@starwind-ui/mcp"]
    }
  }
}
```

Restart or reload the MCP client after adding the server. Use the client-displayed live schema when
it differs from this reference.

## V3 Surfaces

The MCP keeps styled components, Primitive adapters, and Runtime APIs distinct through `surface`
filters. Use [layers.md](./layers.md) for layer selection and ownership rules. The MCP validates the
versioned `ai-manifest.json`, caches valid metadata, and uses a bundled V3 fallback when the live
manifest is unavailable; returned metadata identifies its source.

## Current Tools

The current package registers five tools. Calls return readable JSON plus MCP `structuredContent`:

| Tool | Inputs | Returns |
| --- | --- | --- |
| `starwind_docs` | optional `topic`, `surface`, `full` | exact component, Primitive, guide, or Runtime Markdown; otherwise filtered/full aggregate docs |
| `starwind_search` | optional `query`, `cwd`, `surface`, `framework`, `category`, `plan`, `limit`, `offset` | separate styled, Primitive, and Pro groups plus discovery/upgrade guidance |
| `starwind_add` | required `components`; optional `surface`, `framework`, `to`, `overwrite`, `init`, `pro`, `cwd`, `packageManager` | validated commands, skipped/invalid items, project context, and any deferred paid install |
| `starwind_init` | optional `cwd`, `packageManager`, `framework`, `pro` | V3 init command, detected project context, requirements, warnings, and next steps |
| `starwind_migrate` | optional `cwd`, `packageManager`, `yes` | applicability, migration command, project context, warnings, and post-migration review list |

Older MCP installations or older public docs may expose `search_starwind_pro_blocks`. Prefer
`starwind_search` when the client offers it; the older tool searches only Pro blocks with `query`,
`category`, `plan`, and `limit`.

## Using The Tools

### Documentation

Set `surface` when `auto` would confuse a styled component with a same-named Primitive. Prefer
exact `resultType: "page"`; `filtered` is a degraded aggregate excerpt.

```json
{ "topic": "combobox", "surface": "primitive" }
```

### Search

Use `surface` and `framework` when relevant. Read `styledComponents`, `primitives`, and `proBlocks`
separately; React searches omit Astro-only Pro blocks.

```json
{ "query": "combobox", "surface": "primitive", "framework": "react" }
```

```json
{ "query": "pricing", "framework": "astro", "plan": "free", "limit": 10 }
```

### Add

`surface` defaults to `styled`. Primitive requests generate `primitives add`, and only they accept
a safe relative `to` path. `overwrite` is opt-in, and `all` must stand alone.

```json
{ "components": ["button", "dialog"], "framework": "astro", "cwd": "/absolute/project/path" }
```

```json
{ "components": ["combobox"], "surface": "primitive", "framework": "react", "to": "src/primitives" }
```

Inspect success, warnings, invalid items, commands, and any deferred command before execution.

### Init

The tool detects framework and package manager from `cwd`; `framework` can override detection.
`pro` defaults to false and is rejected for React. It reports the Node.js 22.12+ requirement and
redirects detected legacy config to migration.

```json
{ "cwd": "/absolute/project/path", "framework": "react" }
```

### Migrate

The tool returns a command only for an applicable legacy Astro project. It is interactive by
default; `yes: true` explicitly permits backup-and-overwrite behavior.

```json
{ "cwd": "/absolute/project/path" }
```

Read its warnings and review list, then follow [v3-migration.md](./v3-migration.md) for the actual
runbook.

## Command Boundaries

MCP generates guidance; it does not execute commands or authorize destructive changes. Use
[cli.md](./cli.md) and current CLI help for styled `update`/`remove`, Primitive `update`/`list`, and
other workflows not exposed as MCP tools. MCP can generate Primitive add and migration commands,
but the CLI owns their exact execution behavior.

Run generated commands only from the intended project root, preview destructive updates, and
inspect every written file.

## Public AI Files

When MCP is unavailable, use:

- `https://starwind.dev/llms.txt`: concise public overview.
- `https://starwind.dev/llms-full.txt`: full static AI reference.
- `https://starwind.dev/ai-manifest.json`: versioned components, guides, styled/Primitive/Runtime
  layers, framework targets, and MCP metadata.
- Per-page Markdown: append `.md` to a docs route, for example
  `https://starwind.dev/docs/components/combobox.md` or
  `https://starwind.dev/docs/primitives/combobox.md`.

CLI documentation lookup also returns page references:

```bash
npx starwind@latest docs button combobox --json
```

A URL or manifest record is a context pointer. Read its content before implementing props, events,
parts, framework behavior, or Runtime APIs.

## Source Priority

Resolve different kinds of truth from the source that owns them:

1. Local `starwind.config.json`, installed component/Primitive source, package versions, framework
   files, and tests own the current application state.
2. The client-displayed MCP schema and current MCP responses own the available tool contract.
3. Current Starwind Markdown docs own public component, Primitive, Runtime, and guide APIs.
4. Current CLI help/source owns commands and flags; registry metadata owns installable targets and
   dependencies.
5. `llms.txt`, `llms-full.txt`, and `ai-manifest.json` provide broad/static fallback context.
6. Memory is last.

Local installed source can be older than current docs, while fallback MCP metadata can be older than
the live manifest. State which side differs and choose intentionally rather than silently mixing
versions.

## Before Using Results

Pass `cwd` where supported, but independently confirm framework, layer, config, destinations, local
exports, and installed source. After running a generated command, inspect every written file and run
the relevant format, typecheck, build, tests, and browser checks.

## Pro Results

Pro blocks currently target Astro. Free results use `installCommand` after ordinary initialization;
paid results use `deferredInstallCommand` plus `proUpgrade`. Run the returned setup before a deferred
install and only when paid authorization is intended. Setup auto-detects the package manager. Keep
`STARWIND_LICENSE_KEY` in ignored `.env.local` and out of prompts, logs, code, and handoff text.
