<script lang="ts">
// Incremental builds can reuse this page's HTML from an older build, so the build time may be stale.
// The island replaces it with the time in build-info.json, which every build regenerates.
import { loadBuildInfo } from "@/lib/load-build-info";
import { formatBuildTime } from "@/utils/date";

interface Props {
	builtAt: string;
	timezone: string;
}

const { builtAt, timezone }: Props = $props();

let latest = $state<string | null>(null);
const text = $derived(formatBuildTime(new Date(latest ?? builtAt), timezone));

$effect(() => {
	let cancelled = false;
	void loadBuildInfo().then((info) => {
		if (info && !cancelled) latest = info.builtAt;
	});
	return () => {
		cancelled = true;
	};
});
</script>

<span class="font-excalifont text-white/80">{text}</span>
