import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parsePyqName } from "@/lib/pyqs";

// Contributors copy these examples, so the site must accept every one of them.
const guide = await readFile(
	path.join(import.meta.dir, "../src/pages/contribute.md"),
	"utf-8",
);

// Matches list items such as: - `tcs101_midsem_2023.pdf`
const examples = [...guide.matchAll(/^- `([^`]+\.pdf)`$/gm)].map(
	(match) => match[1],
);

describe("contribute.md file naming examples", () => {
	test("the guide lists examples", () => {
		expect(examples.length).toBeGreaterThan(0);
	});

	test.each(examples)("%s follows the naming scheme", (example) => {
		expect(parsePyqName(path.parse(example).name)).not.toBeNull();
	});
});
