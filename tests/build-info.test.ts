import { describe, expect, test } from "bun:test";
import { createBuildInfo } from "@/lib/create-build-info";
import { renderIconSvg } from "@/lib/icons";
import { formatBuildTime } from "@/utils/date";

describe("renderIconSvg", () => {
	test.each(["mdi:web", "simple-icons:github"])("renders %s", (name) => {
		const svg = renderIconSvg(name);
		expect(svg).toStartWith("<svg");
		expect(svg).toContain(`data-icon="${name}"`);
		expect(svg).toContain("currentColor");
	});

	test.each(["mdi:does-not-exist", "unknown-set:web", "no-prefix"])("returns null for %s", (name) => {
		expect(renderIconSvg(name)).toBeNull();
	});
});

describe("createBuildInfo", () => {
	test("serialises the build time and drops socials with unknown icons", () => {
		const info = createBuildInfo(
			[
				{ id: "github", name: "GitHub", url: "https://github.com/x", iconify: "simple-icons:github" },
				{ id: "bad", name: "Bad", url: "https://example.com", iconify: "mdi:does-not-exist" },
			],
			new Date("2026-09-30T12:00:00Z"),
		);

		expect(info.builtAt).toBe("2026-09-30T12:00:00.000Z");
		expect(info.socials.map((s) => s.id)).toEqual(["github"]);
		expect(info.socials[0]).toMatchObject({ name: "GitHub", url: "https://github.com/x" });
		expect(info.socials[0].svg).toStartWith("<svg");
	});

	test("round-trips through JSON", () => {
		const info = createBuildInfo([]);
		expect(JSON.parse(JSON.stringify(info))).toEqual(info);
	});
});

describe("formatBuildTime", () => {
	test("formats in the given timezone", () => {
		// 12:00 UTC is 17:30 in Asia/Kolkata
		expect(formatBuildTime(new Date("2026-09-30T12:00:00Z"), "Asia/Kolkata")).toMatch(/30\/9\/2026.*5:30:00\s?pm/i);
	});
});
