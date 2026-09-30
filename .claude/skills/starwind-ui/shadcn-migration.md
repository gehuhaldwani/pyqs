# Shadcn-Style Theme Migration

This reference migrates theme tokens only. For a legacy Starwind UI product upgrade, use [v3-migration.md](./v3-migration.md).

Starwind tokens are intentionally familiar to shadcn-style themes, but the target is Tailwind CSS v4 with `@theme inline` and Starwind's CSS variable names.

## Migration Strategy

1. Read the source theme and identify semantic values only.
2. Locate the active Starwind CSS file.
3. Merge values into the existing `:root` and `.dark` blocks.
4. Preserve Starwind's `@theme inline` mappings.
5. Preserve Starwind-specific tokens such as `--primary-accent`, `--secondary-accent`, status colors, and sidebar tokens.
6. Check foreground/background contrast after migration.

## Starwind-Only Tokens To Preserve

These do not always have a direct shadcn source value. Keep their existing Starwind values unless
the migration intentionally supplies a semantic replacement:

| Token family                                      | Preserve because                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `--primary-accent`, `--secondary-accent`          | Brand text needs readable colors on the page background.                         |
| `--info*`, `--success*`, `--warning*`, `--error*` | Status variants depend on both background and foreground pairs.                  |
| `--sidebar-*`                                     | Sidebar surfaces, actions, borders, and focus outlines use a separate token set. |

## Common Mapping

| Source concept       | Starwind token           |
| -------------------- | ------------------------ |
| background           | `--background`           |
| foreground           | `--foreground`           |
| card                 | `--card`                 |
| card foreground      | `--card-foreground`      |
| popover              | `--popover`              |
| popover foreground   | `--popover-foreground`   |
| primary              | `--primary`              |
| primary foreground   | `--primary-foreground`   |
| secondary            | `--secondary`            |
| secondary foreground | `--secondary-foreground` |
| muted                | `--muted`                |
| muted foreground     | `--muted-foreground`     |
| accent               | `--accent`               |
| accent foreground    | `--accent-foreground`    |
| border               | `--border`               |
| input                | `--input`                |
| ring                 | `--outline`              |
| radius               | `--radius`               |

## Sidebar Tokens

If the source theme includes sidebar values, map them to:

- `--sidebar-background`
- `--sidebar-foreground`
- `--sidebar-primary`
- `--sidebar-primary-foreground`
- `--sidebar-accent`
- `--sidebar-accent-foreground`
- `--sidebar-border`
- `--sidebar-outline`

## Value Formats

Follow the existing Starwind file's value style. Current templates commonly reference Tailwind CSS v4 palette variables such as `var(--color-blue-700)` and `var(--color-neutral-950)`.

If the source theme uses HSL channel values or OKLCH values, convert or preserve them only if the local CSS already supports that format cleanly.

## Avoid

- Do not paste a whole foreign CSS file over `starwind.css`.
- Do not remove Starwind's status tokens, sidebar tokens, or `@theme inline` block.
- Do not rename Starwind tokens to shadcn names if Starwind already has an equivalent.
