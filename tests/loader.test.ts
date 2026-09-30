import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { LoaderContext } from "astro/loaders";
import { filesystemLoader, formatSkippedSummary } from "@/lib/content/loader";
import { pyqRules } from "@/lib/content/pyq-rules";
import {
	type DirEntry,
	type FileEntry,
	type FsEntry,
	fsEntrySchema,
} from "@/lib/content/schema";
import type { PyqData } from "@/lib/pyqs";

type StoredEntry = {
	id: string;
	data: FsEntry;
	digest?: string;
	rendered?: { html: string };
};

function createContext() {
	const entries = new Map<string, StoredEntry>();
	const warnings: string[] = [];
	const errors: string[] = [];

	const context = {
		store: {
			set: (entry: StoredEntry) => {
				entries.set(entry.id, entry);
				return true;
			},
			get: (id: string) => entries.get(id),
			has: (id: string) => entries.has(id),
			keys: () => [...entries.keys()],
			values: () => [...entries.values()],
			entries: () => [...entries.entries()],
			delete: (id: string) => {
				entries.delete(id);
			},
			clear: () => entries.clear(),
		},
		logger: {
			info: () => {},
			warn: (msg: string) => warnings.push(msg),
			error: (msg: string) => errors.push(msg),
		},
		generateDigest: (data: unknown) =>
			Bun.hash(JSON.stringify(data)).toString(),
		renderMarkdown: async (content: string) => ({
			html: `<p>${content.trim()}</p>`,
		}),
		// Like Astro, validate against the collection schema (and strip unknown keys)
		parseData: async ({ data }: { data: unknown }) => fsEntrySchema.parse(data),
	};

	return {
		context: context as unknown as LoaderContext,
		entries,
		warnings,
		errors,
		dir: (id: string) => entries.get(id)?.data as DirEntry | undefined,
		file: (id: string) => entries.get(id)?.data as FileEntry | undefined,
	};
}

async function writeTree(root: string, files: string[]) {
	for (const file of files) {
		const full = path.join(root, file);
		await fs.mkdir(path.dirname(full), { recursive: true });
		await fs.writeFile(full, file.endsWith(".md") ? "Hello" : "");
	}
}

let root: string;

beforeEach(async () => {
	root = await fs.mkdtemp(path.join(os.tmpdir(), "pyqs-loader-"));
	await writeTree(root, [
		"bca/sem 1/tcs101_midsem_2023.pdf",
		"bca/sem 1/tcs101_endsem_2023_may.PDF",
		"bca/sem 1/random notes.pdf",
		"bca/sem 1/readme.txt",
		"bca/index.md",
		"ba jmc/radio production & podcast/tcs101_midsem_2024.pdf",
		".github/workflow.yml",
		".hidden.pdf",
	]);
});

afterEach(async () => {
	await fs.rm(root, { recursive: true, force: true });
});

function loader() {
	return filesystemLoader({
		root,
		rules: pyqRules,
	});
}

describe("filesystemLoader", () => {
	test("stores directories and valid files with POSIX paths", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		expect([...entries.keys()].sort()).toEqual([
			"/",
			"/ba jmc/",
			"/ba jmc/radio production & podcast/",
			"/ba jmc/radio production & podcast/tcs101_midsem_2024.pdf",
			"/bca/",
			"/bca/sem 1/",
			"/bca/sem 1/tcs101_endsem_2023_may.PDF",
			"/bca/sem 1/tcs101_midsem_2023.pdf",
		]);
	});

	test("sets parentPath correctly at every level", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		expect(entries.get("/")?.data.parentPath).toBe("/");
		// Regression: top-level folders used to get "/./"
		expect(entries.get("/bca/")?.data.parentPath).toBe("/");
		expect(entries.get("/bca/sem 1/")?.data.parentPath).toBe("/bca/");
		expect(
			entries.get("/bca/sem 1/tcs101_midsem_2023.pdf")?.data.parentPath,
		).toBe("/bca/sem 1/");
	});

	test("file entries have a bare name and lower-case extension", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		const upper = entries.get("/bca/sem 1/tcs101_endsem_2023_may.PDF")?.data;
		expect(upper?.name).toBe("tcs101_endsem_2023_may");
		expect(upper?.type === "file" && upper.extension).toBe(".pdf");
	});

	test("directory entries list child directories as summaries", async () => {
		const { context, dir } = createContext();
		await loader().load(context);

		expect(dir("/bca/")?.directories).toEqual([
			{ type: "dir", name: "sem 1", path: "/bca/sem 1/", parentPath: "/bca/" },
		]);
		expect(dir("/bca/")?.files).toEqual([]);
		expect(
			dir("/bca/sem 1/")
				?.files.map((f) => f.name)
				.sort(),
		).toEqual(["tcs101_endsem_2023_may", "tcs101_midsem_2023"]);
	});

	test("stores parsed PYQ details on file entries and in the parent listing", async () => {
		const { context, dir, file } = createContext();
		await loader().load(context);

		const expected: PyqData = {
			subjects: [{ subject_code: "tcs101", specialization_code: null }],
			type: "endsem",
			no: null,
			back: false,
			year: 2023,
			month: 5,
			date: null,
			set: null,
		};
		expect(file("/bca/sem 1/tcs101_endsem_2023_may.PDF")?.pyq).toEqual(
			expected,
		);
		expect(
			dir("/bca/sem 1/")?.files.find((f) => f.name === "tcs101_endsem_2023_may")
				?.pyq,
		).toEqual(expected);
	});

	test("every stored entry satisfies the collection schema", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		for (const { data } of entries.values()) {
			expect(fsEntrySchema.parse(data)).toEqual(data);
		}
	});

	test("renders index.md into the directory entry", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		expect(entries.get("/bca/")?.rendered?.html).toBe("<p>Hello</p>");
		expect(entries.get("/bca/sem 1/")?.rendered).toBeUndefined();
	});

	test("skips hidden entries and warns about invalid files", async () => {
		const { context, entries, warnings, errors } = createContext();
		await loader().load(context);

		expect(
			[...entries.keys()].some(
				(id) => id.includes(".github") || id.includes(".hidden"),
			),
		).toBe(false);
		expect(warnings).toContain(
			"Skipping file /bca/sem 1/random notes.pdf due to validation",
		);
		expect(warnings).toContain(
			"Skipping file /bca/sem 1/readme.txt due to validation",
		);
		expect(errors).toEqual([]);
	});

	test("checks each directory only once", async () => {
		const { context, dir } = createContext();
		const seen: string[] = [];
		await filesystemLoader({
			root,
			rules: {
				...pyqRules,
				directory: (entry) => {
					seen.push(entry.path);
					return entry.path !== "/ba jmc/";
				},
			},
		}).load(context);

		expect(seen.filter((p) => p === "/bca/sem 1/")).toHaveLength(1);
		expect(seen).not.toContain("/ba jmc/radio production & podcast/");
		expect(dir("/")?.directories.map((d) => d.path)).toEqual(["/bca/"]);
	});

	test("sets a digest that changes with content", async () => {
		const first = createContext();
		await loader().load(first.context);
		await fs.writeFile(path.join(root, "bca/index.md"), "Changed");
		const second = createContext();
		await loader().load(second.context);

		expect(first.entries.get("/bca/")?.digest).toBeString();
		expect(first.entries.get("/bca/")?.digest).not.toBe(
			second.entries.get("/bca/")?.digest,
		);
		expect(first.entries.get("/bca/sem 1/")?.digest).toBe(
			second.entries.get("/bca/sem 1/")?.digest,
		);
	});

	// Regression: the cached data store kept entries for deleted files.
	test("removes entries for deleted files and directories on reload", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		await fs.rm(path.join(root, "bca/sem 1/tcs101_midsem_2023.pdf"));
		await fs.rm(path.join(root, "ba jmc"), { recursive: true });
		await loader().load(context);

		expect(entries.has("/bca/sem 1/tcs101_midsem_2023.pdf")).toBe(false);
		expect(entries.has("/ba jmc/")).toBe(false);
		expect(
			entries.has("/ba jmc/radio production & podcast/tcs101_midsem_2024.pdf"),
		).toBe(false);
		expect(entries.has("/bca/sem 1/tcs101_endsem_2023_may.PDF")).toBe(true);
	});
});

describe("skipped summary", () => {
	test("is logged once after loading, grouped by extension", async () => {
		const { context, warnings } = createContext();
		await filesystemLoader({
			root,
			rules: { ...pyqRules, directory: (entry) => entry.path !== "/ba jmc/" },
		}).load(context);

		// Per-file warnings are kept
		expect(warnings).toContain(
			"Skipping file /bca/sem 1/random notes.pdf due to validation",
		);
		expect(warnings.at(-1)).toBe(
			[
				"Skipped 1 directory:",
				"    /ba jmc/",
				"Skipped 2 files that did not match the loader rules:",
				"  .pdf (1)",
				"    /bca/sem 1/random notes.pdf",
				"  .txt (1)",
				"    /bca/sem 1/readme.txt",
			].join("\n"),
		);
	});

	test("is not logged when nothing is skipped", async () => {
		const { context, warnings } = createContext();
		await fs.rm(path.join(root, "bca/sem 1/random notes.pdf"));
		await fs.rm(path.join(root, "bca/sem 1/readme.txt"));
		await loader().load(context);

		expect(warnings).toEqual([]);
	});

	test("does not carry skipped paths over between loads", async () => {
		const { context, warnings } = createContext();
		await loader().load(context);
		await loader().load(context);

		const summaries = warnings.filter((w) => w.startsWith("Skipped"));
		expect(summaries).toHaveLength(2);
		expect(summaries[0]).toBe(summaries[1]);
	});
});

describe("formatSkippedSummary", () => {
	test("returns null when nothing was skipped", () => {
		expect(
			formatSkippedSummary({ skippedFiles: [], skippedDirectories: [] }),
		).toBeNull();
	});

	test("sorts groups and paths, and labels files without an extension", () => {
		expect(
			formatSkippedSummary({
				skippedFiles: ["/b/y.PDF", "/README.md", "/LICENSE", "/a/x.pdf"],
				skippedDirectories: [],
			}),
		).toBe(
			[
				"Skipped 4 files that did not match the loader rules:",
				"  (no extension) (1)",
				"    /LICENSE",
				"  .md (1)",
				"    /README.md",
				"  .pdf (2)",
				"    /a/x.pdf",
				"    /b/y.PDF",
			].join("\n"),
		);
	});
});
