import { describe, expect, test } from "bun:test";
import {
	acceptDirectory,
	type LoaderRules,
	processFile,
} from "@/lib/content/rules";
import type { DirEntry, FileEntry } from "@/lib/content/schema";

const dir: DirEntry = {
	type: "dir",
	name: "bca",
	path: "/bca/",
	parentPath: "/",
	directories: [],
	files: [],
};
const file = (extension: string): FileEntry => ({
	type: "file",
	kind: "file",
	name: "x",
	path: `/bca/x${extension}`,
	parentPath: "/bca/",
	extension,
});

describe("acceptDirectory", () => {
	test("accepts everything without a rule", () => {
		expect(acceptDirectory(dir)).toBe(true);
		expect(acceptDirectory(dir, {})).toBe(true);
	});

	test("uses the directory rule", () => {
		expect(acceptDirectory(dir, { directory: (d) => d.name !== "bca" })).toBe(
			false,
		);
	});
});

describe("processFile", () => {
	const rules: LoaderRules = {
		file: {
			".pdf": (entry) => ({ ...entry, name: "renamed" }),
			"*": () => null,
		},
	};

	test("keeps files unchanged without rules", () => {
		expect(processFile(file(".txt"))).toEqual(file(".txt"));
	});

	test("applies the rule for the extension", () => {
		expect(processFile(file(".pdf"), rules)?.name).toBe("renamed");
	});

	test("falls back to the '*' rule", () => {
		expect(processFile(file(".txt"), rules)).toBeNull();
	});

	test("keeps files with no matching rule and no fallback", () => {
		expect(processFile(file(".txt"), { file: { ".pdf": () => null } })).toEqual(
			file(".txt"),
		);
	});
});
