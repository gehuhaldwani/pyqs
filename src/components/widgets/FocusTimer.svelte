<script lang="ts">
// A Pomodoro timer: 25 minutes of focus, then a 5 minute break. It keeps running across pages.
import { onMount, type Snippet } from "svelte";
import { prefersReducedMotion } from "svelte/motion";
import { scale } from "svelte/transition";
import { Button } from "@/components/starwind-svelte/button";

interface Props {
	// The icon inside the toggle, rendered by Astro.
	children?: Snippet;
}

const { children }: Props = $props();

type Phase = "focus" | "break";
type TimerState = {
	phase: Phase;
	// Set while running.
	endsAt: number | null;
	// Set while paused.
	remaining: number | null;
};

const KEY = "pyqs-focus-timer";
const DURATIONS: Record<Phase, number> = {
	focus: 25 * 60_000,
	break: 5 * 60_000,
};

let timer = $state.raw<TimerState | null>(null);
let now = $state(Date.now());
let status = $state("");

function load(): TimerState | null {
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as TimerState) : null;
	} catch {
		return null;
	}
}

function save(next: TimerState | null) {
	timer = next;
	try {
		if (next) localStorage.setItem(KEY, JSON.stringify(next));
		else localStorage.removeItem(KEY);
	} catch {
		// Private windows can block storage. The timer still works on this page.
	}
}

function remainingAt(state: TimerState, at: number): number {
	if (state.endsAt !== null) return Math.max(0, state.endsAt - at);
	return state.remaining ?? DURATIONS[state.phase];
}

function format(ms: number): string {
	const total = Math.ceil(ms / 1000);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

const running = $derived(timer?.endsAt != null);
const time = $derived(timer ? format(remainingAt(timer, now)) : "");
const label = $derived(!timer ? "Focus" : running ? time : `${time} paused`);
const ariaLabel = $derived(
	!timer
		? "Start a 25 minute focus timer"
		: `${timer.phase === "focus" ? "Focus" : "Break"} timer, ${time} left. ${running ? "Pause" : "Resume"}`,
);

// The tomato wiggles when the timer starts, pauses, resets or changes phase.
let tomato = $state<HTMLSpanElement>();
function nudge() {
	if (prefersReducedMotion.current) return;
	tomato?.animate(
		[
			{ rotate: "0deg" },
			{ rotate: "-12deg" },
			{ rotate: "10deg" },
			{ rotate: "0deg" },
		],
		{ duration: 450, easing: "ease-in-out" },
	);
}

function tick() {
	now = Date.now();
	if (!timer || timer.endsAt === null || remainingAt(timer, now) > 0) return;
	nudge();
	if (timer.phase === "focus") {
		save({ phase: "break", endsAt: now + DURATIONS.break, remaining: null });
		status = "Focus done. Take a 5 minute break.";
	} else {
		save(null);
		status = "Break over. Ready for another round?";
	}
}

// Storage is only readable in the browser, so the saved timer loads after hydration.
// onMount doesn't track what tick() reads, so writing the timer here can't loop.
onMount(() => {
	timer = load();
	tick();
	const id = setInterval(tick, 1000);
	return () => clearInterval(id);
});

function toggle() {
	nudge();
	now = Date.now();
	if (!timer) {
		save({ phase: "focus", endsAt: now + DURATIONS.focus, remaining: null });
		status = "Focus timer started, 25 minutes.";
	} else if (timer.endsAt !== null) {
		save({ ...timer, endsAt: null, remaining: remainingAt(timer, now) });
		status = "Timer paused.";
	} else {
		save({ ...timer, endsAt: now + remainingAt(timer, now), remaining: null });
		status = "Timer resumed.";
	}
}

function reset() {
	nudge();
	save(null);
	status = "Timer reset.";
}

// Another tab can start or stop the timer.
function onstorage(event: StorageEvent) {
	if (event.key === KEY) timer = load();
}
</script>

<svelte:window {onstorage} />

<div class="flex items-center gap-1">
	<Button
		variant="ghost"
		size="sm"
		class="h-10 rounded-full border bg-card px-3 font-semibold shadow-soft motion-safe:active:scale-95 data-[phase=break]:bg-sticky-mint data-[phase=focus]:bg-sticky-coral data-phase:text-sticky-ink data-[phase=break]:hover:bg-sticky-mint/85 data-[phase=focus]:hover:bg-sticky-coral/85 data-phase:hover:text-sticky-ink"
		data-phase={timer?.phase}
		title="Focus timer: 25 min study, 5 min break"
		aria-label={ariaLabel}
		onclick={toggle}
	>
		<span class="inline-flex" bind:this={tomato}>
			{@render children?.()}
		</span>
		<span class="tabular-nums">{label}</span>
	</Button>
	{#if timer}
		<span
			class="inline-flex"
			transition:scale={{ start: 0.5, duration: prefersReducedMotion.current ? 0 : 160 }}
		>
			<Button
				variant="ghost"
				size="icon-sm"
				class="size-8 rounded-full text-muted-foreground motion-safe:active:scale-90"
				aria-label="Reset focus timer"
				title="Reset"
				onclick={reset}
			>
				<svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
					<path d="M6 6l12 12M18 6L6 18"></path>
				</svg>
			</Button>
		</span>
	{/if}
	<span class="sr-only" aria-live="polite">{status}</span>
</div>
