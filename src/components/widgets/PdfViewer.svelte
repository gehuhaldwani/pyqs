<script lang="ts">
import { navigate } from "astro:transitions/client";
import type {
	CommandDefinition,
	LayoutFunction,
	ThemeConfig,
	Viewer,
} from "@embedpdf/viewer-svelte";
import { PDFViewer } from "@embedpdf/viewer-svelte";
import { onMount } from "svelte";
import { type AnnotationApi, keepAnnotations } from "@/lib/pdf-annotations";
import { starred } from "@/lib/starred.svelte";

interface Props {
	src: string;
	// What the star saves: the page's site path and the text its card shows on the home page.
	path: string;
	title: string;
	detail?: string;
}

const { src, path, title, detail }: Props = $props();

const CLOSE_COMMAND_ID = "site:close";
const STAR_COMMAND_ID = "site:star";

type AppState = { starred: boolean; toggleStar: () => void };

// The server renders the paper unstarred, so the star shows once the island mounts.
let mounted = $state(false);
const appState: AppState = $derived({
	starred: mounted && starred.has(path),
	toggleStar: () => starred.toggle({ path, title, detail }),
});

// Tabler's star. The fill only draws while the accent is set, so the outline is its own path and always shows.
const STAR_PATH =
	"M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z";
const icons = {
	star: [{ d: STAR_PATH, fill: "secondary" as const }, STAR_PATH],
};

const features = {
	forms: false,
	redaction: false,
	snapshots: false,
	signatures: false,
	stamps: false,
	comments: false,
	shapes: false,
	"documents.open": false,
};

const commands: CommandDefinition<AppState>[] = [
	{
		id: STAR_COMMAND_ID,
		// No `active`, since the viewer draws pressed buttons with a ring. The fill and label show the state.
		label: "{action}",
		labelParams: ({ appState }) => ({
			action: appState.starred ? "Unstar" : "Star",
		}),
		icon: "star",
		iconAccent: ({ appState }) =>
			appState.starred ? { secondary: "#ffd02f" } : null,
		run: ({ appState }) => {
			appState.toggleStar();
		},
	},
	{
		id: CLOSE_COMMAND_ID,
		label: "Close",
		icon: "x",
		run: () => {
			void navigate("../");
		},
	},
];

// Download and the view controls sit at the end with search, and Close comes last.
// Scanned papers rarely have text to search, and 320px phones need the room for the close button.
const layout: LayoutFunction = (layout, env) => {
	let next = layout
		.removeBar(["form", "redact", "insert"])
		.remove(["menu:document", "menu:view"], { from: "main" })
		.add("document:download", { to: "main", section: "end", group: "paper" })
		.add("menu:view", { to: "main", group: "paper" })
		.add(
			{ command: STAR_COMMAND_ID, importance: 4 },
			{ to: "main", section: "end" },
		)
		// Importance 5 pins it, so it never moves into the "More" menu on narrow screens.
		.add(
			{ command: CLOSE_COMMAND_ID, importance: 5 },
			{ to: "main", section: "end" },
		);
	if (env.width <= 400) next = next.remove("panel:search", { from: "main" });
	return next;
};

// Site variables reach the viewer because custom properties inherit into shadow DOM.
// The background is transparent so the element's own bg-canvas dots show behind the pages.
const tokens = {
	accent: "var(--foreground)",
	background: "transparent",
	surface: "var(--card)",
	"surface-raised": "var(--popover)",
	text: "var(--foreground)",
	"text-muted": "var(--muted-foreground)",
	border: "var(--border)",
	hover: "var(--accent)",
	canvas: "var(--background)",
	tooltip: "var(--foreground)",
	"tooltip-text": "var(--background)",
	font: "var(--font-figtree), system-ui, sans-serif",
};

// The viewer follows the site toggle, which sets the .dark class, rather than the OS.
let dark = $state(false);
const theme: ThemeConfig = $derived({
	preference: dark ? "dark" : "light",
	tokens,
});

onMount(() => {
	mounted = true;
	const root = document.documentElement;
	const sync = () => {
		dark = root.classList.contains("dark");
	};
	sync();
	const observer = new MutationObserver(sync);
	observer.observe(root, { attributes: true, attributeFilter: ["class"] });
	return () => observer.disconnect();
});

function onready(viewer: Viewer) {
	// The annotation plugin belongs to the document, so it appears once the PDF has opened.
	// Saving starts when its status is ready, which is after every annotation in the PDF has loaded.
	let attached = false;
	viewer.watch(
		() => viewer.tryGet("annotation")?.getStatus(),
		(status) => {
			const api = viewer.tryGet("annotation");
			if (status !== "ready" || !api || attached) return;
			attached = true;
			keepAnnotations(api as unknown as AnnotationApi, src);
		},
		{ immediate: true },
	);
}
</script>

<PDFViewer
    {src}
    {features}
    {commands}
    {layout}
    {theme}
    {icons}
    {appState}
    {onready}
    warnBeforeLeaving={false}
    class="bg-canvas w-full h-dvh pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
/>
