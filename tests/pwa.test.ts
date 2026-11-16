import { describe, expect, test } from "bun:test";
import { createManifest } from "@/lib/pwa";

describe("createManifest", () => {
	const manifest = createManifest({
		base: "/pyqs/",
		name: "GEHU PYQs Archive",
		shortName: "PYQs Archive",
		description: "Papers",
	});

	test("keeps the app inside the site's base path", () => {
		expect(manifest.start_url).toBe("/pyqs/");
		expect(manifest.scope).toBe("/pyqs/");
		expect(manifest.id).toBe("/pyqs/");
	});

	test("prefixes icon paths with the base", () => {
		for (const icon of manifest.icons) {
			expect(icon.src.startsWith("/pyqs/icons/")).toBe(true);
		}
	});

	test("has installable icon sizes, including a maskable one", () => {
		const sizes = manifest.icons.map((icon) => icon.sizes);
		expect(sizes).toContain("192x192");
		expect(sizes).toContain("512x512");
		expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(
			true,
		);
	});
});
