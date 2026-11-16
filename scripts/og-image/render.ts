// Renders banner.html to public/og.png with a headless Chromium browser, then compresses it with sharp.
// Set BROWSER_PATH to use a browser other than the default Edge or Chrome install.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;

const here = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(here, "../..");
const source = join(here, "banner.html");
const output = join(root, "public", "og.png");

const candidates = [
	process.env.BROWSER_PATH,
	"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
	"C:/Program Files/Google/Chrome/Application/chrome.exe",
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/usr/bin/google-chrome",
	"/usr/bin/chromium",
];
const browser = candidates.find((path) => path && existsSync(path));
if (!browser) {
	throw new Error("No Chromium browser found. Set BROWSER_PATH.");
}

const workDir = mkdtempSync(join(tmpdir(), "pyqs-og-"));
const screenshot = join(workDir, "og.png");

try {
	// The time budget lets the web fonts load before the screenshot.
	const result = spawnSync(browser, [
		"--headless=new",
		"--disable-gpu",
		"--hide-scrollbars",
		"--force-device-scale-factor=1",
		`--user-data-dir=${join(workDir, "profile")}`,
		`--window-size=${WIDTH},${HEIGHT}`,
		"--virtual-time-budget=10000",
		`--screenshot=${screenshot}`,
		pathToFileURL(source).href,
	]);
	if (!existsSync(screenshot)) {
		throw new Error(`Browser did not write a screenshot:\n${result.stderr}`);
	}

	const info = await sharp(screenshot)
		.resize(WIDTH, HEIGHT, { fit: "cover", position: "left top" })
		.png({ compressionLevel: 9, palette: true, quality: 90 })
		.toFile(output);
	console.log(
		`Wrote ${output} (${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB)`,
	);
} finally {
	rmSync(workDir, { recursive: true, force: true });
}
