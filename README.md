# PYQs Archive website

This is the website for the GEHU previous year question papers archive, live at <https://haldwani.gehu.in/pyqs/>. It is an [Astro](https://astro.build) site that turns a folder of question papers into browsable pages, with a PDF viewer for each paper.

The code and the papers live in the same GitHub repository, [gehuhaldwani/pyqs](https://github.com/gehuhaldwani/pyqs), on two branches:

| Branch | Contents |
| --- | --- |
| `gh-pages` | This website (you are here) |
| `main` | The question papers, organized in folders |

## Quick start

You need [Bun](https://bun.sh). Node.js 22.12 or later also works for running Astro, but the scripts and tests use Bun.

```sh
git clone --branch gh-pages --single-branch https://github.com/gehuhaldwani/pyqs.git pyqs-web
cd pyqs-web
git clone --branch main --single-branch https://github.com/gehuhaldwani/pyqs.git pyqs
bun install
bun run dev
```

Open <http://localhost:4321/pyqs/>. The site reads papers from the `pyqs/` folder, which `.gitignore` excludes from this branch.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Starts the dev server |
| `bun run build` | Builds the site into `dist/` |
| `bun run preview` | Serves the built `dist/` folder |
| `bun run test` | Runs the unit tests in `tests/` |
| `bun run check` | Type-checks the site and the tests |
| `bun run lint` | Checks formatting and lint rules with Biome |
| `bun run format` | Fixes formatting and import order |
| `bun run ci` | Runs lint, tests and type checks, like CI does |

## Documentation

- [Development](docs/development.md) covers setup, tests, tooling and conventions.
- [Architecture](docs/architecture.md) explains how the site turns folders into pages.
- [Content](docs/content.md) describes the folder layout, file naming and markdown docs.
- [Deployment](docs/deployment.md) covers the GitHub Actions workflows and build caching.

## Contributing papers

Students can send papers through the [contribution guide](https://haldwani.gehu.in/pyqs/contribute/). Papers go to the `main` branch, and each push there rebuilds this site.

## License

MIT
