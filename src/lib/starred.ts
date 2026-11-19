// Starred files live in the browser's localStorage, so they stay on one device.
// Each entry keeps what a card needs to show, so the home page can list them without the content store.

type StarredFile = {
	// The file's site path, such as "/bca/sem 1/bca101_endsem_2024.pdf".
	path: string;
	title: string;
	detail?: string;
	// When it was starred, in milliseconds since the epoch.
	starredAt: number;
};

const STARRED_KEY = "pyqs-starred";

function isStarredFile(value: unknown): value is StarredFile {
	if (typeof value !== "object" || value === null) return false;
	const file = value as Record<string, unknown>;
	return (
		typeof file.path === "string" &&
		typeof file.title === "string" &&
		(file.detail === undefined || typeof file.detail === "string") &&
		typeof file.starredAt === "number"
	);
}

// Ignores anything malformed, since another version of the site may have written the value.
function parseStarred(raw: string | null): StarredFile[] {
	if (!raw) return [];
	try {
		const value: unknown = JSON.parse(raw);
		if (!Array.isArray(value)) return [];
		const seen = new Set<string>();
		return value.filter((file): file is StarredFile => {
			if (!isStarredFile(file) || seen.has(file.path)) return false;
			seen.add(file.path);
			return true;
		});
	} catch {
		return [];
	}
}

// Newest first, so a file starred just now leads the list. Unstarring drops every copy of the path.
function toggleStarred(
	files: readonly StarredFile[],
	file: Omit<StarredFile, "starredAt">,
	now: number,
): StarredFile[] {
	if (files.some((f) => f.path === file.path)) {
		return files.filter((f) => f.path !== file.path);
	}
	return [{ ...file, starredAt: now }, ...files];
}

// The folders a file sits in, such as ["b pharma", "sem 2", "biochemistry"].
function folderTrail(path: string): string[] {
	return path.split("/").filter(Boolean).slice(0, -1);
}

export type { StarredFile };
export { folderTrail, parseStarred, STARRED_KEY, toggleStarred };
