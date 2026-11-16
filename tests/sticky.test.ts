import { describe, expect, test } from "bun:test";
import { STICKY_COLORS, stickyColor, stickyTilt } from "@/lib/sticky";

describe("stickyColor", () => {
	test("gives the same color for the same name in any case", () => {
		expect(stickyColor("btech")).toBe(stickyColor("BTECH"));
		expect(stickyTilt("btech")).toBe(stickyTilt("BTECH"));
	});

	test("returns one of the sticky colors", () => {
		for (const name of ["bca", "mba", "sem 1", ""]) {
			expect(STICKY_COLORS).toContain(stickyColor(name));
		}
	});
});
