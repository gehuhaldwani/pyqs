import { createHash } from "node:crypto";

// Astro's incremental build hashes a page's server code, but hydrated islands also ship client code.
// An island edit that only changes its client code would reuse old HTML pointing at a deleted script, so pages mix this hash into their cacheKey.
const sources = import.meta.glob<string>(
	["/src/**/*.svelte", "/src/**/*.svelte.ts"],
	{ query: "?raw", import: "default", eager: true },
);

const hash = createHash("sha256");
for (const path of Object.keys(sources).sort()) {
	hash.update(path);
	hash.update("\n");
	hash.update(sources[path]);
	hash.update("\n");
}

const ISLAND_VERSION = hash.digest("hex").slice(0, 12);

export { ISLAND_VERSION };
