import type { Loader, LoaderContext } from "astro/loaders";
import fs from "node:fs/promises";
import path from "node:path";
import { acceptDirectory, processFile, type LoaderRules } from "./rules";
import { fsEntrySchema, type DirEntry, type FsEntry } from "./schema";

type LoadState = {
    // Ids stored during this load; anything else in the store is stale
    seen: Set<string>;
    // Paths rejected by the loader rules, reported in a summary at the end
    skippedFiles: string[];
    skippedDirectories: string[];
};

// "" -> "/", "a/b" -> "/a/b/"
function toDirPath(relativePath: string): string {
    return relativePath ? `/${relativePath}/` : "/";
}

// Lists skipped paths, with files grouped by extension so that e.g. badly
// named PDFs stand out from unrelated files. Returns null if nothing was skipped.
export function formatSkippedSummary({
    skippedFiles,
    skippedDirectories,
}: Pick<LoadState, "skippedFiles" | "skippedDirectories">): string | null {
    if (skippedFiles.length === 0 && skippedDirectories.length === 0) {
        return null;
    }

    const lines: string[] = [];

    if (skippedDirectories.length > 0) {
        lines.push(`Skipped ${skippedDirectories.length} director${skippedDirectories.length === 1 ? "y" : "ies"}:`);
        lines.push(...skippedDirectories.toSorted().map((p) => `    ${p}`));
    }

    if (skippedFiles.length > 0) {
        const byExtension = Map.groupBy(
            skippedFiles,
            (p) => path.posix.extname(p).toLowerCase() || "(no extension)",
        );
        lines.push(`Skipped ${skippedFiles.length} file${skippedFiles.length === 1 ? "" : "s"} that did not match the loader rules:`);
        for (const extension of [...byExtension.keys()].sort()) {
            const paths = byExtension.get(extension) ?? [];
            lines.push(`  ${extension} (${paths.length})`);
            lines.push(...paths.toSorted().map((p) => `    ${p}`));
        }
    }

    return lines.join("\n");
}

// Validates an entry against the collection schema and stores it.
async function storeEntry(
    context: LoaderContext,
    state: LoadState,
    entry: {
        id: string;
        data: FsEntry;
        filePath: string;
        content?: string;
    },
) {
    state.seen.add(entry.id);
    const data = await context.parseData({
        id: entry.id,
        data: entry.data,
        filePath: entry.filePath,
    });
    context.store.set({
        id: entry.id,
        data,
        filePath: entry.filePath,
        digest: context.generateDigest({ data, content: entry.content ?? "" }),
        rendered: entry.content
            ? await context.renderMarkdown(entry.content)
            : undefined,
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

        let content: string | undefined;

        // Process files
        for (const entry of visibleEntries.filter((e) => e.isFile())) {
            const filePath = path.join(dirPath, entry.name);

            if (entry.name === "index.md" || entry.name === "index.mdx") {
                content = await fs.readFile(filePath, "utf-8");
                continue;
            }

            const fileRelativePath = `${directoryRelativePath}${entry.name}`;
            const { name, ext } = path.parse(entry.name);

            const fileEntry = processFile(
                {
                    type: "file",
                    name,
                    path: fileRelativePath,
                    parentPath: directoryRelativePath,
                    extension: ext.toLowerCase(),
                },
                rules,
            );

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
            });
        }

        await storeEntry(context, state, {
            id: directoryRelativePath,
            data: directoryEntry,
            filePath: dirPath,
            content,
        });

        return directoryEntry;
    } catch (error) {
        context.logger.error(`Error processing directory ${dirPath}: ${error}`);
    }
}

export function filesystemLoader(options: { root: string, rules?: LoaderRules }): Loader {
    return {
        name: "fs-loader",
        schema: fsEntrySchema,
        async load(context) {
            context.logger.info("Loading filesystem content");

            const state: LoadState = { seen: new Set(), skippedFiles: [], skippedDirectories: [] };

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
};
