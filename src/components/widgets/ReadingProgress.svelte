<script lang="ts">
// A thin bar at the top of the page that fills as you read, so long pages feel finite.
let scrollY = $state(0);
let innerHeight = $state(0);
let scrollHeight = $state(0);

const progress = $derived.by(() => {
	const scrollable = scrollHeight - innerHeight;
	return scrollable > 0 ? Math.min(1, scrollY / scrollable) : 0;
});

function measure() {
	scrollHeight = document.documentElement.scrollHeight;
}

// The page can grow after load, as images and ads arrive.
$effect(() => {
	measure();
	const observer = new ResizeObserver(measure);
	observer.observe(document.documentElement);
	return () => observer.disconnect();
});
</script>

<svelte:window bind:scrollY bind:innerHeight />

<div
	class="pointer-events-none fixed inset-x-0 top-0 z-50 h-1.5 origin-left bg-brand-yellow"
	style:transform="scaleX({progress})"
	aria-hidden="true"
></div>
