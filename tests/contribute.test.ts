import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parsePyqName } from "@/lib/pyqs";

// The contribution guide tells people how to name files; its examples must
// actually be accepted by the site, or contributors' papers get skipped.
const guide = await readFile(
	path.join(import.meta.dir, "../src/pages/contribute.md"),
	"utf-8",
);

// Example list items look like: - `tcs101_midsem_2023.pdf`
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
