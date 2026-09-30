import { describe, expect, test } from "bun:test";
import { pyqRules } from "@/lib/content/pyq-rules";
import { processFile } from "@/lib/content/rules";
import type { FileEntry } from "@/lib/content/schema";

const file = (name: string, extension: string): FileEntry => ({
	type: "file",
	kind: "file",
	name,
	path: `/bca/${name}${extension}`,
	parentPath: "/bca/",
	extension,
});

describe("pyqRules", () => {
	test("keeps correctly named PDFs as pdf entries with parsed details", () => {
		const entry = processFile(file("tcs101_midsem_2023", ".pdf"), pyqRules);
		expect(entry?.kind).toBe("pdf");
		expect(entry?.pyq?.year).toBe(2023);
	});

	test("skips PDFs that don't follow the naming scheme", () => {
		expect(processFile(file("BHM701 ", ".pdf"), pyqRules)).toBeNull();
	});

	test.each(["notes", "Syllabus 2024", "tcs101_midsem_2023"])(
		"keeps any markdown file as a doc: %s",
		(name) => {
			const entry = processFile(file(name, ".md"), pyqRules);
			expect(entry?.kind).toBe("doc");
			expect(entry?.pyq).toBeUndefined();
		},
	);

	test.each(["README", "readme", "ReadMe"])("hides %s.md", (name) => {
		expect(processFile(file(name, ".md"), pyqRules)).toBeNull();
	});

	test.each([".txt", ".docx", ""])("skips other files: '%s'", (extension) => {
		expect(processFile(file("x", extension), pyqRules)).toBeNull();
	});
});
