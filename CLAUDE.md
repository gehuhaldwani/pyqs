# CLAUDE.md

Astro 7 site for the GEHU previous year question papers archive. It turns the folder of papers in `pyqs/` into pages: folders list their contents, papers open in a PDF viewer, and markdown files become doc pages.

## Repository layout

- This checkout is the `gh-pages` branch of gehuhaldwani/pyqs, which holds the site code.
- `pyqs/` is a separate clone of the `main` branch with the papers and the GitHub Actions workflows. It is gitignored here. Treat it as another repository, and don't commit to it unless asked.
- Read [docs/architecture.md](docs/architecture.md) before changing the loader, routing or layouts.

## Commands

```sh
bun run dev      # dev server at http://localhost:4321/pyqs/
bun run ci       # lint + tests + type checks; run before calling work done
bun run build    # full build into dist/ (about 20s, incremental rebuilds are faster)
bun run format   # Biome formatting and import sorting
```

Verify changes with `bun run ci` and `bun run build`. For UI changes, also check the built site with `bun run preview`.

## Conventions

- Keep the site modular and file-type agnostic. Files have a `kind` (`pdf`, `doc`, `file`) set by the loader rules, and pages and listings switch on it. Add a kind for a new format instead of hard-coding extension checks. Keep domain data, such as the PYQ naming scheme, separate from the file kind.
- Derived data belongs in the loader (`src/lib/content/`), so pages read it from the content store.
- Tests go in `tests/` and use `bun:test`. Bun can't resolve `astro:*` imports, so keep testable logic in modules without them, such as `src/utils/url.ts`.
- Comments explain only what the code can't, in at most two plain sentences. Avoid em dashes and filler.
- Use `NavLink` for links, `src/utils/site-url.ts` for site paths, and the tokens and utilities in `src/styles/global.css` for colors and repeated class sets.
- The Starwind CLI generates `src/components/starwind/`, `src/styles/starwind.css` and `src/lib/utils/starwind/`. Change them through the CLI or the starwind-ui MCP server, not by hand.

## Gotchas

- `astro check` doesn't support TypeScript 7, so TypeScript is pinned to 6.
- Incremental builds reuse pages whose `cacheKey` (the loader's digest) and route code are unchanged. Anything a page shows that is neither content nor code, such as the build time, must come from `/build-info.json` at runtime.
- `ClientRouter` keeps head scripts alive across page changes. Scripts that must run once per visit need a guard, as the ad loader in `Head.astro` has.
- PDF pages turn off ads (`ads={false}`) and pinch-zoom (`lockZoom`) on purpose.
- Files in this repo use LF line endings (`.gitattributes`), even on Windows.
