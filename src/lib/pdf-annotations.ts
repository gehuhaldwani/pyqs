import { loadAnnotations, saveAnnotations } from "@/lib/annotation-store";

// The parts of EmbedPDF's annotation capability used below. The plugin package isn't a direct dependency.
type Ref = object;
type Listen = (listener: () => void) => unknown;
type Bundle = object;
export type AnnotationApi = {
	getStatus: () => string;
	list: () => readonly { nm: string | null; ref: Ref }[];
	export: (selection?: { refs: Ref[] }) => Promise<Bundle>;
	import: (bundle: Bundle, options?: { history?: boolean }) => Promise<unknown>;
	onResynced: Listen;
	onCreated: Listen;
	onUpdated: Listen;
	onDeleted: Listen;
};

function isBundle(value: unknown): value is Bundle {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { format?: unknown }).format === "embedpdf/annotations"
	);
}

// Saves the reader's own annotations for this paper and puts them back when it opens again.
// Annotations that came inside the PDF are left out, so they aren't added twice on the next visit.
export function keepAnnotations(api: AnnotationApi, key: string) {
	let baseline: Set<string | null> | undefined;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;

	async function save() {
		clearTimeout(saveTimer);
		saveTimer = undefined;
		const own = api.list().filter((item) => item.nm && !baseline?.has(item.nm));
		const bundle =
			own.length > 0 ? await api.export({ refs: own.map((i) => i.ref) }) : [];
		await saveAnnotations(key, own.length > 0 ? [bundle] : []);
	}

	function scheduleSave() {
		if (!baseline) return;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(save, 400);
	}

	// Runs once every annotation in the PDF has loaded, so the baseline can't miss any of them.
	async function start() {
		if (baseline || api.getStatus() !== "ready") return;
		baseline = new Set(api.list().map((item) => item.nm));
		const [saved] = await loadAnnotations<Bundle>(key);
		// The v2 viewer saved a different format under the same key. It can't be imported, and the next save replaces it.
		if (!isBundle(saved)) return;
		try {
			await api.import(saved, { history: false });
		} catch {
			// A bundle the engine rejects is left alone, and the paper still opens.
		}
	}

	api.onResynced(() => void start());
	api.onCreated(scheduleSave);
	api.onUpdated(scheduleSave);
	api.onDeleted(scheduleSave);

	// A cached PDF can finish loading before these listeners are attached, so its resync event is already gone.
	if (api.getStatus() === "ready") void start();

	// Save right away when the reader leaves, so the last change isn't lost to the delay.
	const flush = () => {
		if (saveTimer !== undefined) void save();
	};
	document.addEventListener("astro:before-preparation", flush, { once: true });
	window.addEventListener("pagehide", flush, { once: true });
}
