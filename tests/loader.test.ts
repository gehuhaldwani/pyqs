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
	filePath?: string;
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
		// Stand-in for Astro's renderer that reads `key: value` frontmatter.
		renderMarkdown: async (content: string) => {
			const match = /^---\n([\s\S]*?)\n---\n?/.exec(content);
			const frontmatter = Object.fromEntries(
				(match?.[1] ?? "")
					.split("\n")
					.map((line) => line.split(/:\s*/, 2))
					.filter((pair) => pair.length === 2),
			);
			const body = match ? content.slice(match[0].length) : content;
			return { html: `<p>${body.trim()}</p>`, metadata: { frontmatter } };
		},
		// Validates and strips unknown keys, as Astro does.
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
		// Regression test. Top-level folders used to get "/./".
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

	// Regression test. The cached data store used to keep entries for deleted files.
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

		// The per-file warnings still appear.
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
			formatSkippedSummary({
				skippedFiles: [],
				skippedDirectories: [],
				emptyDirectories: [],
			}),
		).toBeNull();
	});

	test("sorts groups and paths, and labels files without an extension", () => {
		expect(
			formatSkippedSummary({
				skippedFiles: ["/b/y.PDF", "/README.md", "/LICENSE", "/a/x.pdf"],
				skippedDirectories: [],
				emptyDirectories: [],
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

describe("empty directories", () => {
	test("leaves out directories with nothing kept inside them", async () => {
		await writeTree(root, [
			// Holds only a misnamed paper.
			"bhm/sem 7/food production 2 a/BHM701 .pdf",
			// Holds only an empty directory.
			"bba/sem 2/old/notes.txt",
		]);
		const { context, entries, dir, warnings } = createContext();
		await loader().load(context);

		for (const id of [
			"/bhm/",
			"/bhm/sem 7/",
			"/bhm/sem 7/food production 2 a/",
			"/bba/",
			"/bba/sem 2/",
			"/bba/sem 2/old/",
		]) {
			expect(entries.has(id)).toBe(false);
		}
		expect(
			dir("/")
				?.directories.map((d) => d.path)
				.sort(),
		).toEqual(["/ba jmc/", "/bca/"]);
		expect(warnings.at(-1)).toContain(
			[
				"Left out 6 empty directories:",
				"    /bba/",
				"    /bba/sem 2/",
				"    /bba/sem 2/old/",
				"    /bhm/",
				"    /bhm/sem 7/",
				"    /bhm/sem 7/food production 2 a/",
			].join("\n"),
		);
	});

	test("keeps a directory that only has an index.md", async () => {
		await writeTree(root, ["notes/index.md"]);
		const { context, dir } = createContext();
		await loader().load(context);

		expect(dir("/notes/")?.files).toEqual([]);
		expect(dir("/")?.directories.map((d) => d.path)).toContain("/notes/");
	});

	test("always keeps the root", async () => {
		const emptyRoot = await fs.mkdtemp(path.join(os.tmpdir(), "pyqs-empty-"));
		try {
			const { context, dir } = createContext();
			await filesystemLoader({ root: emptyRoot, rules: pyqRules }).load(
				context,
			);
			expect(dir("/")).toMatchObject({ path: "/", directories: [], files: [] });
		} finally {
			await fs.rm(emptyRoot, { recursive: true, force: true });
		}
	});

	test("removes a directory from the store once it becomes empty", async () => {
		const { context, entries } = createContext();
		await loader().load(context);
		expect(entries.has("/ba jmc/radio production & podcast/")).toBe(true);

		await fs.rm(
			path.join(
				root,
				"ba jmc/radio production & podcast/tcs101_midsem_2024.pdf",
			),
		);
		await loader().load(context);

		expect(entries.has("/ba jmc/radio production & podcast/")).toBe(false);
		expect(entries.has("/ba jmc/")).toBe(false);
	});
});

describe("stored file paths", () => {
	test("use forward slashes on every OS", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		for (const entry of entries.values()) {
			expect(entry.filePath).not.toContain("\\");
		}
		expect(
			entries.get("/bca/sem 1/tcs101_midsem_2023.pdf")?.filePath,
		).toEndWith("/bca/sem 1/tcs101_midsem_2023.pdf");
	});
});

describe("markdown docs", () => {
	test("lists markdown files as docs, without name filtering", async () => {
		await writeTree(root, [
			"bca/sem 1/syllabus notes.md",
			"bca/sem 1/README.md",
			"bca/guides/how to study.md",
		]);
		await fs.writeFile(
			path.join(root, "bca/guides/how to study.md"),
			"---\ntitle: How to Study\n---\n# Tips",
		);
		const { context, dir, file, entries, warnings } = createContext();
		await loader().load(context);

		const notes = file("/bca/sem 1/syllabus notes.md");
		expect(notes).toMatchObject({ kind: "doc", name: "syllabus notes" });
		expect(notes?.title).toBeUndefined();
		expect(entries.get("/bca/sem 1/syllabus notes.md")?.rendered?.html).toBe(
			"<p>Hello</p>",
		);

		// The frontmatter sets the title and is not part of the page body.
		expect(file("/bca/guides/how to study.md")?.title).toBe("How to Study");
		expect(entries.get("/bca/guides/how to study.md")?.rendered?.html).toBe(
			"<p># Tips</p>",
		);

		expect(
			dir("/bca/sem 1/")
				?.files.map((f) => `${f.kind}:${f.name}`)
				.sort(),
		).toEqual([
			"doc:syllabus notes",
			"pdf:tcs101_endsem_2023_may",
			"pdf:tcs101_midsem_2023",
		]);

		// A folder with only docs is not empty.
		expect(dir("/bca/")?.directories.map((d) => d.path)).toContain(
			"/bca/guides/",
		);

		// README.md stays hidden.
		expect(entries.has("/bca/sem 1/README.md")).toBe(false);
		expect(warnings.at(-1)).toContain("/bca/sem 1/README.md");
	});

	test("the doc's digest changes with its content", async () => {
		await writeTree(root, ["bca/notes.md"]);
		const first = createContext();
		await loader().load(first.context);
		await fs.writeFile(path.join(root, "bca/notes.md"), "Changed");
		const second = createContext();
		await loader().load(second.context);

		expect(first.entries.get("/bca/notes.md")?.digest).not.toBe(
			second.entries.get("/bca/notes.md")?.digest,
		);
	});
});
