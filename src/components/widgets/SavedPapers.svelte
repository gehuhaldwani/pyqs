<script lang="ts">
// Lists the papers the service worker saved, so they can be opened offline.
import { base } from "astro:config/client";

interface Props {
	// Saved papers are cached under their raw GitHub URL, which starts with this.
	prefix: string;
}

const { prefix }: Props = $props();

// Matches PAPERS in src/lib/service-worker.js.
const PAPERS_CACHE = "pyqs-papers";

type SavedPaper = { href: string; name: string; where: string };

let papers = $state.raw<SavedPaper[] | null>(null);

function toPaper(url: string): SavedPaper {
	const path = url.slice(prefix.length);
	const parts = decodeURIComponent(path).split("/");
	const file = (parts.pop() ?? "").replace(/\.pdf$/i, "");
	return {
		href: `${base}${path}/`,
		name: file.replaceAll("_", " ").toUpperCase(),
		where: parts.join(" › "),
	};
}

$effect(() => {
	let cancelled = false;
	caches
		.open(PAPERS_CACHE)
		.then((cache) => cache.keys())
		.then((requests) => requests.map((request) => request.url))
		.catch(() => [] as string[])
		.then((urls) => {
			if (cancelled) return;
			papers = urls.filter((url) => url.startsWith(prefix)).map(toPaper);
		});
	return () => {
		cancelled = true;
	};
});
</script>

{#if papers && papers.length > 0}
	<ul class="grid gap-3 sm:grid-cols-2">
		{#each papers as paper (paper.href)}
			<li>
				<a href={paper.href} class="paper-card note-hover focus-ring flex flex-col gap-1 p-4 text-left">
					<span class="font-bold break-words">{paper.name}</span>
					<span class="text-sm text-muted-foreground capitalize">{paper.where}</span>
				</a>
			</li>
		{/each}
	</ul>
{:else if papers}
	<p class="scribble text-lg">
		nothing saved yet. open a paper while online and it'll be here next time.
	</p>
{/if}
