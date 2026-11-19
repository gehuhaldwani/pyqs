<script lang="ts">
// Stars or unstars a file. Starred files are kept on this device and listed on the home page.
import { onMount } from "svelte";
import { Button } from "@/components/starwind-svelte/button";
import { haptic } from "@/lib/haptics";
import { starred } from "@/lib/starred.svelte";

interface Props {
	path: string;
	title: string;
	detail?: string;
	class?: string;
}

const { path, title, detail, class: className }: Props = $props();

// The server renders every file unstarred, so stars show once the island mounts.
let mounted = $state(false);
onMount(() => {
	mounted = true;
});

const isStarred = $derived(mounted && starred.has(path));

// Set only by a click, so stars that load already set don't animate.
let motion = $state<"star" | "unstar" | null>(null);

// Sparks fly out at even angles when a file is starred.
const SPARKS = [0, 60, 120, 180, 240, 300];

function toggle() {
	motion = isStarred ? "unstar" : "star";
	starred.toggle({ path, title, detail });
}
</script>

<Button
	variant="ghost"
	size="icon-sm"
	class={["relative rounded-full text-muted-foreground hover:text-foreground", className]}
	aria-pressed={isStarred}
	aria-label={isStarred ? `Unstar ${title}` : `Star ${title}`}
	title={isStarred ? "Unstar" : "Star"}
	onclick={toggle}
	{@attach haptic}
>
	<svg
		viewBox="0 0 24 24"
		class={[
			"size-5 transition-colors",
			isStarred ? "fill-brand-yellow stroke-sticky-ink" : "fill-none stroke-current",
			motion,
		]}
		stroke-width="1.75"
		stroke-linejoin="round"
		aria-hidden="true"
		onanimationend={() => (motion = null)}
	>
		<path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
	</svg>
	{#if motion === "star"}
		{#each SPARKS as angle (angle)}
			<span class="spark bg-brand-yellow" style:--angle="{angle}deg" aria-hidden="true"></span>
		{/each}
	{/if}
</Button>

<style>
	.star {
		animation: star-pop 450ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.unstar {
		animation: star-drop 300ms ease-out;
	}

	.spark {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 4px;
		height: 4px;
		margin: -2px;
		border-radius: 9999px;
		pointer-events: none;
		animation: spark 450ms ease-out forwards;
	}

	@keyframes star-pop {
		0% {
			scale: 0.4;
			rotate: -30deg;
		}
		60% {
			scale: 1.3;
			rotate: 8deg;
		}
		100% {
			scale: 1;
			rotate: 0deg;
		}
	}

	@keyframes star-drop {
		0% {
			scale: 1;
		}
		40% {
			scale: 0.7;
			rotate: 15deg;
		}
		100% {
			scale: 1;
			rotate: 0deg;
		}
	}

	@keyframes spark {
		0% {
			opacity: 1;
			transform: rotate(var(--angle)) translateY(0) scale(1);
		}
		100% {
			opacity: 0;
			transform: rotate(var(--angle)) translateY(-16px) scale(0.4);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.star,
		.unstar,
		.spark {
			animation: none;
		}

		.spark {
			display: none;
		}
	}
</style>
