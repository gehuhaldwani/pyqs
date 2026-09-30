import type { Loader, LoaderContext } from "astro/loaders";
import fs from "node:fs/promises";
import path from "node:path";
import { validateDirectory, validateFile, type Validators } from "./validator";
import { fsEntrySchema, type FsEntry } from "./schema";

// "" -> "/", "a/b" -> "/a/b/"
function toDirPath(relativePath: string): string {
    return relativePath ? `/${relativePath}/` : "/";
}

function toDataEntry(
    context: LoaderContext,
    seen: Set<string>,
    entry: {
        id: string;
        data: FsEntry<"dir"> | FsEntry<"file">;
        filePath: string;
        content?: string;
    },
) {
    seen.add(entry.id);
    return {
        id: entry.id,
        data: entry.data as unknown as Record<string, unknown>,
        filePath: entry.filePath,
        digest: context.generateDigest({
            data: entry.data as unknown as Record<string, unknown>,
            content: entry.content ?? "",
        }),
    };
}

// Recursively stores a directory and its contents. Returns the directory entry,
// or undefined if it was skipped.
async function processDirectory({
    dirPath,
    relativePath,
    context,
    validators,
    seen,
}: {
    dirPath: string;
    // POSIX path relative to the loader root, "" for the root itself
    relativePath: string;
    context: LoaderContext;
    validators?: Validators;
    seen: Set<string>;
}): Promise<FsEntry<"dir"> | undefined> {
    const directoryRelativePath = toDirPath(relativePath);
    const parentRelativePath = path.posix.dirname(relativePath);

    const directoryEntry: FsEntry<"dir"> = {
        type: "dir",
        name: path.basename(dirPath),
        path: directoryRelativePath,
        parentPath: toDirPath(parentRelativePath === "." ? "" : parentRelativePath),
        directories: [],
        files: [],
    };

    if (!validateDirectory(directoryEntry, validators)) {
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
                validators,
                seen,
            });

            if (subDirEntry) {
                // Parent only keeps a shallow reference to its children
                directoryEntry.directories.push({
                    ...subDirEntry,
                    directories: [],
                    files: [],
                });
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

            const fileEntry: FsEntry<"file"> = {
                type: "file",
                name,
                path: fileRelativePath,
                parentPath: directoryRelativePath,
                extension: ext.toLowerCase(),
                directories: undefined,
                files: undefined,
            };

            if (!validateFile(fileEntry, validators)) {
                context.logger.warn(
                    `Skipping file ${fileRelativePath} due to validation`,
                );
                continue;
            }

            directoryEntry.files.push(fileEntry);

            context.store.set(
                toDataEntry(context, seen, {
                    id: fileRelativePath,
                    data: fileEntry,
                    filePath,
                }),
            );
        }

        context.store.set({
            ...toDataEntry(context, seen, {
                id: directoryRelativePath,
                data: directoryEntry,
                filePath: dirPath,
                content,
            }),
            rendered: content ? await context.renderMarkdown(content) : undefined,
        });

        return directoryEntry;
    } catch (error) {
        context.logger.error(`Error processing directory ${dirPath}: ${error}`);
    }
}

export function filesystemLoader(options: { root: string, validators?: Validators }): Loader {
    return {
        name: "fs-loader",
        schema: fsEntrySchema,
        async load(context) {
            context.logger.info("Loading filesystem content");

            const seen = new Set<string>();

            await processDirectory({
                dirPath: options.root,
                relativePath: "",
                context,
                validators: options.validators,
                seen,
            });

            // Drop entries for files/directories that no longer exist, so the
            // cached data store does not keep serving deleted or renamed papers.
            for (const id of context.store.keys()) {
                if (!seen.has(id)) {
                    context.store.delete(id);
                }
            }

            context.logger.info("Filesystem content loading completed");
        },
    };
};
