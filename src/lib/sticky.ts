// Sticky-note colors for the whiteboard theme. Class names are written out in full so Tailwind finds them.
import type { ExamType } from "@/lib/pyqs";

const STICKY_COLORS = [
	"bg-sticky-yellow",
	"bg-sticky-teal",
	"bg-sticky-rose",
	"bg-sticky-mint",
	"bg-sticky-orange",
	"bg-sticky-lavender",
	"bg-sticky-coral",
	"bg-sticky-blue",
] as const;

const TILTS = ["-rotate-1", "rotate-1", "rotate-0", "-rotate-2", "rotate-2"];

type StickyColor = (typeof STICKY_COLORS)[number];

// Same color for the same name on every page, so a folder is easy to spot again.
function hashName(name: string): number {
	let hash = 0;
	for (const char of name.toLowerCase()) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}
	return hash;
}

function stickyColor(name: string): StickyColor {
	return STICKY_COLORS[hashName(name) % STICKY_COLORS.length];
}

function stickyTilt(name: string): string {
	return TILTS[
		Math.floor(hashName(name) / STICKY_COLORS.length) % TILTS.length
	];
}

const EXAM_TYPE_COLORS: Record<ExamType, StickyColor> = {
	sessional: "bg-sticky-yellow",
	midsem: "bg-sticky-teal",
	endsem: "bg-sticky-coral",
};

export type { StickyColor };
export { EXAM_TYPE_COLORS, STICKY_COLORS, stickyColor, stickyTilt };
