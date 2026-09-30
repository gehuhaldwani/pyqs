import type { DirEntry, FileEntry } from "./schema";

// Returns false to skip the directory and everything inside it.
type DirectoryRule = (entry: DirEntry) => boolean;

// Returns the entry to store, possibly with extra data such as `pyq`, or null to skip the file.
type FileRule = (entry: FileEntry) => FileEntry | null;

type LoaderRules = {
	directory?: DirectoryRule;
	// Keyed by lower-case extension such as ".pdf". The "*" rule matches any other extension.
	file?: Record<string, FileRule>;
};

function acceptDirectory(entry: DirEntry, rules?: LoaderRules): boolean {
	return rules?.directory?.(entry) ?? true;
}

function processFile(entry: FileEntry, rules?: LoaderRules): FileEntry | null {
	const rule = rules?.file?.[entry.extension] ?? rules?.file?.["*"];
	return rule ? rule(entry) : entry;
}

export type { DirectoryRule, FileRule, LoaderRules };
export { acceptDirectory, processFile };
