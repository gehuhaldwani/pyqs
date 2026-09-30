import fs from "node:fs/promises";
import path from "node:path";
import type { Loader, LoaderContext } from "astro/loaders";
import { acceptDirectory, type LoaderRules, processFile } from "./rules";
import { type DirEntry, type FsEntry, fsEntrySchema } from "./schema";

type LoadState = {
	// Ids stored during this load; anything else in the store is stale
	seen: Set<string>;
	// Paths rejected by the loader rules, reported in a summary at the end
	skippedFiles: string[];
	skippedDirectories: string[];
	// Directories left out because nothing inside them was kept
	emptyDirectories: string[];
};

type SkippedSummary = Pick<
	LoadState,
	"skippedFiles" | "skippedDirectories" | "emptyDirectories"
>;

// "" -> "/", "a/b" -> "/a/b/"
function toDirPath(relativePath: string): string {
	return relativePath ? `/${relativePath}/` : "/";
}

// Stored file paths use forward slashes on every OS.
function toPosixPath(filePath: string): string {
	return filePath.split(path.sep).join("/");
}

function plural(count: number, singular: string, pluralForm: string): string {
	return `${count} ${count === 1 ? singular : pluralForm}`;
}

// Lists skipped paths, with files grouped by extension so that e.g. badly
// named PDFs stand out from unrelated files. Returns null if nothing was skipped.
export function formatSkippedSummary({
	skippedFiles,
	skippedDirectories,
	emptyDirectories,
}: SkippedSummary): string | null {
	if (
		skippedFiles.length === 0 &&
		skippedDirectories.length === 0 &&
		emptyDirectories.length === 0
	) {
		return null;
	}

	const lines: string[] = [];

	if (skippedDirectories.length > 0) {
		lines.push(
			`Skipped ${plural(skippedDirectories.length, "directory", "directories")}:`,
		);
		lines.push(...skippedDirectories.toSorted().map((p) => `    ${p}`));
	}

	if (emptyDirectories.length > 0) {
		lines.push(
			`Left out ${plural(emptyDirectories.length, "empty directory", "empty directories")}:`,
		);
		lines.push(...emptyDirectories.toSorted().map((p) => `    ${p}`));
	}

	if (skippedFiles.length > 0) {
		const byExtension = Map.groupBy(
			skippedFiles,
			(p) => path.posix.extname(p).toLowerCase() || "(no extension)",
		);
		lines.push(
			`Skipped ${plural(skippedFiles.length, "file", "files")} that did not match the loader rules:`,
		);
		for (const extension of [...byExtension.keys()].sort()) {
			const paths = byExtension.get(extension) ?? [];
			lines.push(`  ${extension} (${paths.length})`);
			lines.push(...paths.toSorted().map((p) => `    ${p}`));
		}
	}

	return lines.join("\n");
}

type RenderedContent = Awaited<ReturnType<LoaderContext["renderMarkdown"]>>;

// Markdown source and its rendered HTML, for entries that have a page body
// (a directory's index.md, or a markdown file).
type Markdown = { source: string; rendered: RenderedContent };

async function renderMarkdownFile(
	context: LoaderContext,
	filePath: string,
): Promise<Markdown> {
	const source = await fs.readFile(filePath, "utf-8");
	return { source, rendered: await context.renderMarkdown(source) };
}

// A string `title` from the markdown's frontmatter, if any.
function frontmatterTitle(markdown: Markdown): string | undefined {
	const title = markdown.rendered.metadata?.frontmatter?.title;
	return typeof title === "string" && title.trim() ? title.trim() : undefined;
}

// Validates an entry against the collection schema and stores it.
async function storeEntry(
	context: LoaderContext,
	state: LoadState,
	entry: {
		id: string;
		data: FsEntry;
		filePath: string;
		markdown?: Markdown;
	},
) {
	state.seen.add(entry.id);
	const filePath = toPosixPath(entry.filePath);
	const data = await context.parseData({
		id: entry.id,
		data: entry.data,
		filePath,
	});
	context.store.set({
		id: entry.id,
		data,
		filePath,
		digest: context.generateDigest({
			data,
			content: entry.markdown?.source ?? "",
		}),
		rendered: entry.markdown?.rendered,
	});
}

// Recursively stores a directory and its contents. Returns the directory entry,
// or undefined if it was skipped.
async function processDirectory({
	dirPath,
	relativePath,
	context,
	rules,
	state,
}: {
	dirPath: string;
	// POSIX path relative to the loader root, "" for the root itself
	relativePath: string;
	context: LoaderContext;
	rules?: LoaderRules;
	state: LoadState;
}): Promise<DirEntry | undefined> {
	const directoryRelativePath = toDirPath(relativePath);
	const parentRelativePath = path.posix.dirname(relativePath);

	const directoryEntry: DirEntry = {
		type: "dir",
		name: path.basename(dirPath),
		path: directoryRelativePath,
		parentPath: toDirPath(parentRelativePath === "." ? "" : parentRelativePath),
		directories: [],
		files: [],
	};

	if (!acceptDirectory(directoryEntry, rules)) {
		state.skippedDirectories.push(directoryRelativePath);
		context.logger.warn(
			`Skipping directory ${directoryRelativePath} due to validation`,
		);
		return;
	}

	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });

		// Filter out hidden files/directories
		const visibleEntries = entries.filter(
			(entry) => !entry.name.startsWith("."),
		);

		// Process subdirectories first
		for (const entry of visibleEntries.filter((e) => e.isDirectory())) {
			const subDirEntry = await processDirectory({
				dirPath: path.join(dirPath, entry.name),
				relativePath: path.posix.join(relativePath, entry.name),
				context,
				rules,
				state,
			});

			if (subDirEntry) {
				// Parent only keeps a summary of its children
				const { directories, files, ...summary } = subDirEntry;
				directoryEntry.directories.push(summary);
			}
		}

		// The directory's own index.md, shown below its listing
		let index: Markdown | undefined;

		// Process files
		for (const entry of visibleEntries.filter((e) => e.isFile())) {
			const filePath = path.join(dirPath, entry.name);

			if (entry.name === "index.md" || entry.name === "index.mdx") {
				index = await renderMarkdownFile(context, filePath);
				continue;
			}

			const fileRelativePath = `${directoryRelativePath}${entry.name}`;
			const { name, ext } = path.parse(entry.name);

			let fileEntry = processFile(
				{
					type: "file",
					kind: "file",
					name,
					path: fileRelativePath,
					parentPath: directoryRelativePath,
					extension: ext.toLowerCase(),
				},
				rules,
			);

			// Kept markdown files get a rendered page body, titled by their frontmatter
			let markdown: Markdown | undefined;
			if (fileEntry && fileEntry.extension === ".md") {
				markdown = await renderMarkdownFile(context, filePath);
				const title = frontmatterTitle(markdown);
				if (title) {
					fileEntry = { ...fileEntry, title };
				}
			}

			if (!fileEntry) {
				state.skippedFiles.push(fileRelativePath);
				context.logger.warn(
					`Skipping file ${fileRelativePath} due to validation`,
				);
				continue;
			}

			directoryEntry.files.push(fileEntry);

			await storeEntry(context, state, {
				id: fileRelativePath,
				data: fileEntry,
				filePath,
				markdown,
			});
		}

		// Leave out directories with nothing to show (the root is always kept).
		// Subdirectories are processed first, so this also removes directories
		// that only contain empty directories.
		const isEmpty =
			directoryEntry.files.length === 0 &&
			directoryEntry.directories.length === 0 &&
			index === undefined;
		if (isEmpty && relativePath !== "") {
			state.emptyDirectories.push(directoryRelativePath);
			return;
		}

		await storeEntry(context, state, {
			id: directoryRelativePath,
			data: directoryEntry,
			filePath: dirPath,
			markdown: index,
		});

		return directoryEntry;
	} catch (error) {
		context.logger.error(`Error processing directory ${dirPath}: ${error}`);
	}
}

export function filesystemLoader(options: {
	root: string;
	rules?: LoaderRules;
}): Loader {
	return {
		name: "fs-loader",
		schema: fsEntrySchema,
		async load(context) {
			context.logger.info("Loading filesystem content");

			const state: LoadState = {
				seen: new Set(),
				skippedFiles: [],
				skippedDirectories: [],
				emptyDirectories: [],
			};

			await processDirectory({
				dirPath: options.root,
				relativePath: "",
				context,
				rules: options.rules,
				state,
			});

			// Drop entries for files/directories that no longer exist, so the
			// cached data store does not keep serving deleted or renamed papers.
			for (const id of context.store.keys()) {
				if (!state.seen.has(id)) {
					context.store.delete(id);
				}
			}

			const summary = formatSkippedSummary(state);
			if (summary) {
				context.logger.warn(summary);
			}

			context.logger.info("Filesystem content loading completed");
		},
	};
}
