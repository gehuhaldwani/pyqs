// Screenshots a local HTML file with a headless Chromium browser, then compresses it with sharp.
// Set BROWSER_PATH to use a browser other than the default Edge or Chrome install.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const candidates = [
	process.env.BROWSER_PATH,
	"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
	"C:/Program Files/Google/Chrome/Application/chrome.exe",
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/usr/bin/google-chrome",
	"/usr/bin/chromium",
];

function findBrowser(): string {
	const browser = candidates.find((path) => path && existsSync(path));
	if (!browser) {
		throw new Error("No Chromium browser found. Set BROWSER_PATH.");
	}
	return browser;
}

interface ScreenshotOptions {
	source: string;
	output: string;
	width: number;
	height: number;
	// Appended to the file URL, so one page can render variants.
	query?: string;
	// Keeps the alpha channel, for icons with transparent corners.
	transparent?: boolean;
	// Browser window size, when it differs from the output. Headless windows have a minimum size, so small icons render large and scale down.
	renderWidth?: number;
	renderHeight?: number;
}

async function screenshot({
	source,
	output,
	width,
	height,
	query = "",
	transparent = false,
	renderWidth = width,
	renderHeight = height,
}: ScreenshotOptions): Promise<void> {
	const workDir = mkdtempSync(join(tmpdir(), "pyqs-shot-"));
	const file = join(workDir, "shot.png");

	try {
		// The time budget lets web fonts load before the screenshot.
		const result = spawnSync(findBrowser(), [
			"--headless=new",
			"--disable-gpu",
			"--hide-scrollbars",
			"--force-device-scale-factor=1",
			...(transparent ? ["--default-background-color=00000000"] : []),
			`--user-data-dir=${join(workDir, "profile")}`,
			`--window-size=${renderWidth},${renderHeight}`,
			"--virtual-time-budget=10000",
			`--screenshot=${file}`,
			`${pathToFileURL(source).href}${query}`,
		]);
		if (!existsSync(file)) {
			throw new Error(`Browser did not write a screenshot:\n${result.stderr}`);
		}

		const info = await sharp(file)
			.extract({ left: 0, top: 0, width: renderWidth, height: renderHeight })
			.resize(width, height)
			.png({ compressionLevel: 9, palette: true, quality: 90 })
			.toFile(output);
		console.log(
			`Wrote ${output} (${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB)`,
		);
	} finally {
		rmSync(workDir, { recursive: true, force: true });
	}
}

export { screenshot };
