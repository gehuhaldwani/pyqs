// Web app manifest and service worker settings. No astro:* imports, so the tests can use it.
import { joinBase } from "@/utils/url";

// Matches the light page background and header in src/styles/global.css.
const THEME_COLOR = "#ffffff";

const ICONS = [
	{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
	{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
	{
		src: "/icons/icon-maskable-512.png",
		sizes: "512x512",
		type: "image/png",
		purpose: "maskable",
	},
];

interface ManifestOptions {
	base: string;
	name: string;
	shortName: string;
	description: string;
}

function createManifest({
	base,
	name,
	shortName,
	description,
}: ManifestOptions) {
	const scope = joinBase(base, "/");
	return {
		id: scope,
		name,
		short_name: shortName,
		description,
		lang: "en",
		start_url: scope,
		scope,
		display: "standalone",
		orientation: "any",
		background_color: THEME_COLOR,
		theme_color: THEME_COLOR,
		categories: ["education"],
		icons: ICONS.map((icon) => ({ ...icon, src: joinBase(base, icon.src) })),
	};
}

export { createManifest, THEME_COLOR };
