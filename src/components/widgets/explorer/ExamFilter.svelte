<script lang="ts">
// Filter chips for the paper list. The list stays server-rendered, so the island only hides papers by their data-exam.
import type { Attachment } from "svelte/attachments";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/components/starwind-svelte/toggle-group";

interface Chip {
	type: string;
	label: string;
	count: number;
	// A background utility such as bg-sticky-yellow.
	color: string;
}

interface Props {
	chips: Chip[];
}

const { chips }: Props = $props();

// A single toggle group lets the pressed chip be released, which means no filter.
let selected = $state("all");

const filterList: Attachment<HTMLElement> = (node) => {
	const list = node.closest("[data-paper-list]");
	if (!list) return;
	for (const paper of list.querySelectorAll<HTMLElement>("[data-exam]")) {
		paper.hidden = selected !== "all" && paper.dataset.exam !== selected;
	}
	for (const group of list.querySelectorAll<HTMLElement>("[data-year-group]")) {
		group.hidden = !group.querySelector("[data-exam]:not([hidden])");
	}
};

// Toggle group items set background and hover colors through group selectors that outrank plain utilities.
// So chip colors use important utilities, and the color comes in as a variable.
// The theme is inline, so bg-sticky-yellow has no --color-* variable and this reads --sticky-yellow instead.
function chipColor(color: string) {
	return `var(--${color.replace(/^bg-/, "")})`;
}
</script>

<div class="mb-8" {@attach filterList}>
	<ToggleGroup
		defaultValue={["all"]}
		onValueChange={(next) => (selected = next[0] ?? "all")}
		size="sm" class="flex-wrap" aria-label="Filter papers by exam">
		<ToggleGroupItem
			value="all"
			class="rounded-full border bg-card! px-4 text-foreground! transition-[color,background-color,border-color,box-shadow,scale] motion-safe:active:scale-95 data-[state=off]:hover:bg-muted! data-[state=on]:border-foreground data-[state=on]:bg-foreground! data-[state=on]:text-background!"
		>
			All
		</ToggleGroupItem>
		{#each chips as chip (chip.type)}
			<ToggleGroupItem
				value={chip.type}
				class="rounded-full border border-transparent bg-(--chip)! px-4 text-sticky-ink! transition-[color,background-color,border-color,box-shadow,scale] motion-safe:active:scale-95 hover:bg-(--chip)/85! data-[state=on]:border-sticky-ink data-[state=on]:shadow-soft"
				style="--chip: {chipColor(chip.color)}"
			>
				{chip.label}
				<span class="opacity-60">{chip.count}</span>
			</ToggleGroupItem>
		{/each}
	</ToggleGroup>
</div>
