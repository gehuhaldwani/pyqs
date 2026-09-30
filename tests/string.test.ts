import { describe, expect, test } from "bun:test";
import { formatPageTitle, toTitleCase } from "@/utils/string";

describe("toTitleCase", () => {
	test("capitalises each word", () => {
		expect(toTitleCase("data WAREHOUSING & data mining")).toBe("Data Warehousing & Data Mining");
	});
});

describe("formatPageTitle", () => {
	test("appends the page title", () => {
		expect(formatPageTitle("PYQs Archive", "About")).toBe("PYQs Archive | About");
	});

	test.each([undefined, ""])("falls back to the site title for %p", (pageTitle) => {
		expect(formatPageTitle("PYQs Archive", pageTitle)).toBe("PYQs Archive");
	});
});
