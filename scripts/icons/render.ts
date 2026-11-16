// Renders icon.html to the app icons in public/icons, used by the web app manifest and the page head.
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { screenshot } from "../lib/screenshot";

const here = fileURLToPath(new URL(".", import.meta.url));
const outDir = resolve(here, "../../public/icons");
mkdirSync(outDir, { recursive: true });

const icons = [
	{ name: "favicon-48.png", size: 48, variant: "any" },
	{ name: "icon-192.png", size: 192, variant: "any" },
	{ name: "icon-512.png", size: 512, variant: "any" },
	{ name: "icon-maskable-512.png", size: 512, variant: "full" },
	// iOS rounds the corners itself and shows transparency as black, so this one is full bleed.
	{ name: "apple-touch-icon.png", size: 180, variant: "full" },
];

for (const icon of icons) {
	await screenshot({
		source: join(here, "icon.html"),
		output: join(outDir, icon.name),
		width: icon.size,
		height: icon.size,
		query: `?variant=${icon.variant}`,
		transparent: icon.variant === "any",
		renderWidth: 512,
		renderHeight: 512,
	});
}
