<script lang="ts">
// The home page's list of starred files, read from this device's storage.
import { onMount, type Snippet } from "svelte";
import { flip } from "svelte/animate";
import { cubicOut } from "svelte/easing";
import { prefersReducedMotion } from "svelte/motion";
import { fade, scale, slide } from "svelte/transition";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/starwind-svelte/alert-dialog";
import { Button } from "@/components/starwind-svelte/button";
import { haptic } from "@/lib/haptics";
import { folderTrail } from "@/lib/starred";
import { starred } from "@/lib/starred.svelte";
import { addForwardSlashAndBaseUrl } from "@/utils/site-url";
import StarButton from "./StarButton.svelte";

interface Props {
	// The empty state's illustration, rendered by Astro.
	children?: Snippet;
}

const { children }: Props = $props();

// Storage is only readable in the browser, so nothing shows until the island mounts.
let mounted = $state(false);
onMount(() => {
	mounted = true;
});

// An unstarred card waits for its star's animation, then shrinks away while the rest slide over.
function motionMs(ms: number) {
	return prefersReducedMotion.current ? 0 : ms;
}

// The star's wobble, then the card shrinking away.
const STAR_MS = 150;
const LEAVE_MS = 200;
const FOLD_MS = 280;

// Slides the height open or shut while fading and scaling slightly, so the page below moves smoothly.
function fold(node: Element, params: { delay?: number; duration?: number }) {
	const base = slide(node, { ...params, easing: cubicOut });
	return {
		...base,
		css: (t: number, u: number) =>
			`${base.css?.(t, u) ?? ""}; opacity: ${t}; scale: ${0.97 + 0.03 * t};`,
	};
}

// Whether the list has shown this visit. The empty card only animates in after the last paper is unstarred, not on load.
let hadFiles = $state(false);
$effect(() => {
	if (starred.files.length > 0) hadFiles = true;
});
</script>

<section aria-labelledby="starred-title" class="mb-12">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<h2 id="starred-title" class="section-title">
			Starred
			{#if mounted && starred.files.length > 0}
				<span
					class="pill-tag bg-foreground text-sm text-background"
					transition:scale={{ start: 0.6, duration: motionMs(LEAVE_MS), delay: motionMs(STAR_MS) }}
				>
					{starred.files.length}
				</span>
			{/if}
		</h2>

		{#if mounted && starred.files.length > 0}
			<div transition:fade={{ duration: motionMs(LEAVE_MS), delay: motionMs(STAR_MS) }}>
			<AlertDialog>
				<AlertDialogTrigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="sm" class="rounded-full text-muted-foreground motion-safe:active:scale-95" {@attach haptic}>
							Unstar all
						</Button>
					{/snippet}
				</AlertDialogTrigger>
				<AlertDialogContent class="rounded-3xl">
					<AlertDialogHeader>
						<AlertDialogTitle>Unstar all papers?</AlertDialogTitle>
						<AlertDialogDescription>
							{starred.files.length === 1
								? "Your starred paper will be removed from this device."
								: `All ${starred.files.length} starred papers will be removed from this device.`}
							You can star papers again any time.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel class="rounded-full" {@attach haptic}>Cancel</AlertDialogCancel>
						<AlertDialogAction variant="error" class="rounded-full" onclick={() => starred.clear()} {@attach haptic}>
							Unstar all
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			</div>
		{/if}
	</div>

	{#if !mounted}
		<div class="h-32 rounded-3xl border-2 border-dashed border-input bg-card/70" aria-hidden="true"></div>
	{:else if starred.files.length > 0}
		<ul
			class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
			out:fold={{ duration: motionMs(FOLD_MS), delay: motionMs(STAR_MS) }}
		>
			{#each starred.files as file, i (file.path)}
				<li
					class="group/card note-hover-group relative motion-safe:animate-rise"
					style:--i={i}
					animate:flip={{ duration: motionMs(250) }}
					in:scale={{ start: 0.9, duration: motionMs(200) }}
					out:scale={{ start: 0.9, duration: motionMs(200), delay: motionMs(150) }}
				>
					<a
						href={addForwardSlashAndBaseUrl(file.path)}
						data-astro-prefetch="hover"
						class="group paper-card focus-ring flex h-full items-center gap-4 p-4 pr-14 transition-shadow group-hover/card:shadow-lift focus-visible:shadow-lift"
					>
						<span
							class="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-pdf transition-transform motion-safe:group-hover/card:-rotate-6"
						>
							<svg viewBox="0 0 24 24" class="size-7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M14 3v4a1 1 0 0 0 1 1h4" />
								<path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
								<path d="M9 13h6M9 17h4" />
							</svg>
						</span>
						<span class="flex min-w-0 flex-1 flex-col gap-1.5">
							<span class="line-clamp-2 text-base font-bold leading-snug wrap-break-word" translate="no">
								{file.title}
							</span>
							{#if file.detail}
								<span class="text-sm text-muted-foreground">{file.detail}</span>
							{/if}
							<span class="text-xs text-muted-foreground capitalize wrap-break-word">
								{folderTrail(file.path).join(" › ")}
							</span>
						</span>
					</a>
					<div class="absolute top-1/2 right-3 -translate-y-1/2">
						<StarButton path={file.path} title={file.title} detail={file.detail} />
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div
			class="flex w-full flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-input bg-card/70 p-6 text-center motion-safe:animate-rise sm:flex-row sm:text-left"
			in:fold={{
				duration: hadFiles ? motionMs(FOLD_MS) : 0,
				delay: hadFiles ? motionMs(STAR_MS + FOLD_MS) : 0,
			}}
		>
			{@render children?.()}
			<div class="flex-1">
				<p class="text-lg font-bold">No starred papers yet</p>
				<p class="text-muted-foreground">
					Tap the star on a paper to keep it here for quick access. Stars stay on this device.
				</p>
			</div>
		</div>
	{/if}
</section>
