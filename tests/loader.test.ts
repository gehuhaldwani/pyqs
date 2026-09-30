import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { LoaderContext } from "astro/loaders";
import { filesystemLoader } from "@/lib/content/loader";
import type { FsEntry } from "@/lib/content/schema";
import { Pyq } from "@/lib/pyqs";

type StoredEntry = {
	id: string;
	data: FsEntry<"dir"> & FsEntry<"file">;
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
		generateDigest: (data: unknown) => Bun.hash(JSON.stringify(data)).toString(),
		renderMarkdown: async (content: string) => ({ html: `<p>${content.trim()}</p>` }),
	};

	return {
		context: context as unknown as LoaderContext,
		entries,
		warnings,
		errors,
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
		validators: {
			file: {
				".pdf": Pyq.validator,
				"*": () => false,
			},
		},
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
		expect(entries.get("/bca/sem 1/tcs101_midsem_2023.pdf")?.data.parentPath).toBe("/bca/sem 1/");
	});

	test("file entries have a bare name and lower-case extension", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		const upper = entries.get("/bca/sem 1/tcs101_endsem_2023_may.PDF")?.data;
		expect(upper?.name).toBe("tcs101_endsem_2023_may");
		expect(upper?.extension).toBe(".pdf");
	});

	test("directory entries list shallow children", async () => {
		const { context, entries } = createContext();
		await loader().load(context);

		const bca = entries.get("/bca/")?.data;
		expect(bca?.directories.map((d) => d.path)).toEqual(["/bca/sem 1/"]);
		expect(bca?.directories[0].files).toEqual([]);
		expect(bca?.files).toEqual([]);

		const sem1 = entries.get("/bca/sem 1/")?.data;
		expect(sem1?.files.map((f) => f.name).sort()).toEqual([
			"tcs101_endsem_2023_may",
			"tcs101_midsem_2023",
		]);
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

		expect([...entries.keys()].some((id) => id.includes(".github") || id.includes(".hidden"))).toBe(false);
		expect(warnings).toContain("Skipping file /bca/sem 1/random notes.pdf due to validation");
		expect(warnings).toContain("Skipping file /bca/sem 1/readme.txt due to validation");
		expect(errors).toEqual([]);
	});

	test("validates each directory only once", async () => {
		const { context } = createContext();
		const seen: string[] = [];
		await filesystemLoader({
			root,
			validators: {
				directory: (entry) => {
					seen.push(entry.path);
					return entry.path !== "/ba jmc/";
				},
			},
		}).load(context);

		expect(seen.filter((p) => p === "/bca/sem 1/")).toHaveLength(1);
		expect(seen).not.toContain("/ba jmc/radio production & podcast/");
		const rootDir = context.store.get("/")?.data as unknown as FsEntry<"dir">;
		expect(rootDir.directories.map((d) => d.path)).toEqual(["/bca/"]);
	});

	test("sets a digest that changes with content", async () => {
		const first = createContext();
		await loader().load(first.context);
		await fs.writeFile(path.join(root, "bca/index.md"), "Changed");
		const second = createContext();
		await loader().load(second.context);

		expect(first.entries.get("/bca/")?.digest).toBeString();
		expect(first.entries.get("/bca/")?.digest).not.toBe(second.entries.get("/bca/")?.digest);
		expect(first.entries.get("/bca/sem 1/")?.digest).toBe(second.entries.get("/bca/sem 1/")?.digest);
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
		expect(entries.has("/ba jmc/radio production & podcast/tcs101_midsem_2024.pdf")).toBe(false);
		expect(entries.has("/bca/sem 1/tcs101_endsem_2023_may.PDF")).toBe(true);
	});
});
