<script lang="ts">
// Shows the socials Astro rendered until build-info.json loads, then the latest ones from it.
import type { Snippet } from "svelte";
import type { BuildInfo } from "@/lib/build-info";
import { loadBuildInfo } from "@/lib/load-build-info";
import { EXTERNAL_LINK_ATTRIBUTES } from "@/utils/url";

interface Props {
	children?: Snippet;
}

const { children }: Props = $props();

let socials = $state.raw<BuildInfo["socials"]>([]);

$effect(() => {
	let cancelled = false;
	void loadBuildInfo().then((info) => {
		if (info && !cancelled) socials = info.socials;
	});
	return () => {
		cancelled = true;
	};
});

// The SVG comes from this site's own build output, so rendering it as HTML is safe.
function iconMarkup(svg: string) {
	return svg.replace("<svg", '<svg class="social-icon" aria-hidden="true"');
}
</script>

<div class="mt-6 flex gap-4 text-white/80">
	{#if socials.length > 0}
		{#each socials as social (social.url)}
			<a href={social.url} {...EXTERNAL_LINK_ATTRIBUTES} aria-label={social.name}>
				{@html iconMarkup(social.svg)}
			</a>
		{/each}
	{:else}
		{@render children?.()}
	{/if}
</div>
