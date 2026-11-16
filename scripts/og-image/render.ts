// Renders banner.html to public/og.png.
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { screenshot } from "../lib/screenshot";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(here, "../..");

await screenshot({
	source: join(here, "banner.html"),
	output: join(root, "public", "og.png"),
	width: 1200,
	height: 630,
});
