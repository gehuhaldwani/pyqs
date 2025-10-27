import type { Loader, LoaderContext } from "astro/loaders";
import fs from "node:fs/promises";
import path from "node:path";
import { validateDirectory, validateFile, type Validators } from "./validator";
import { fsEntrySchema, type FsEntry } from "./schema";

// Recursive function to process directories

async function processDirectory({
    dirPath,
    relativePath,
    context,
    validators,
}: {
    dirPath: string;
    relativePath: string;
    context: LoaderContext;
    validators?: Validators
}) {
    try {
        const entries = await fs.readdir(
            path.join(process.cwd(), dirPath),
            {
                withFileTypes: true,
            },
        );

        const directoryName = path.basename(dirPath);

        const directoryRelativePath =
            `/${relativePath.replaceAll(/\\/g, "/")}/`.replaceAll("//", "/");
        const directoryParentPath =
            directoryRelativePath === "/"
                ? "/"
                : `/${path.dirname(relativePath || "/").replaceAll(/\\/g, "/")}/`;

        const directoryEntry: FsEntry<"dir"> = {
            type: "dir",
            name: directoryName,
            path: directoryRelativePath,
            parentPath: directoryParentPath,
            directories: [],
            files: [],
        }

        if (!validateDirectory(directoryEntry, validators)) {
            context.logger.warn(
                `Skipping directory ${directoryRelativePath} due to validation`,
            );
            return;
        }

        // Filter out hidden files/directories
        const visibleEntries = entries.filter(
            (entry) => !entry.name.startsWith("."),
        );


        // Process subdirectories first
        for (const entry of visibleEntries.filter((e) => e.isDirectory())) {
            const subDirPath = `/${path
                .join(directoryRelativePath, entry.name)
                .replaceAll(/\\/g, "/")}/`.replaceAll("//", "/");

            // Add subdirectory to entries
            const subDirEntry: FsEntry<"dir"> = {
                name: entry.name,
                type: "dir",
                path: subDirPath,
                parentPath: directoryRelativePath,
                directories: [],
                files: [],
            };

            if (!validateDirectory(subDirEntry, validators)) {
                context.logger.warn(
                    `Skipping subdirectory ${subDirPath} due to validation`,
                );
                continue;
            }

            directoryEntry.directories.push(subDirEntry);

            // Process subdirectory recursively
            await processDirectory({
                dirPath: path.join(dirPath, entry.name),
                relativePath: relativePath
                    ? `${relativePath}/${entry.name}`
                    : entry.name,
                context,
                validators,
            });

        }

        let content: string | undefined;

        // Process files
        for (const entry of visibleEntries.filter((e) => e.isFile())) {
            const fileRelativePath = path
                .join(directoryRelativePath, entry.name)
                .replaceAll(/\\/g, "/");

            if (entry.name === "index.md" || entry.name === "index.mdx") {
                content = await fs.readFile(
                    path.join(dirPath, entry.name),
                    "utf-8",
                );
                continue;
            }

            const fileEntry: FsEntry<"file"> = {
                type: "file",
                name: path.basename(entry.name).replace(path.extname(entry.name), ""),
                path: fileRelativePath,
                parentPath: directoryRelativePath,
                extension: path.extname(entry.name).toLowerCase(),
                directories: undefined,
                files: undefined,
            }

            if (!validateFile(fileEntry, validators)) {
                context.logger.warn(
                    `Skipping file ${fileRelativePath} due to validation`,
                );
                continue;
            }

            directoryEntry.files.push(fileEntry);

            // Store file entry
            context.store.set({
                id: fileRelativePath,
                data: fileEntry,
                filePath: path.join(dirPath, entry.name),
            });
        }

        context.store.set({
            id: directoryRelativePath,
            data: directoryEntry,
            rendered: content ? await context.renderMarkdown(content) : undefined,
            filePath: dirPath,
        });

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

            await processDirectory({
                dirPath: options.root,
                relativePath: "",
                context,
                validators: options.validators,
            });

            context.logger.info("Filesystem content loading completed");
        },
    };
};
