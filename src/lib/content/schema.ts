import { z } from "astro/zod";
import { type PyqData, pyqDataSchema } from "@/lib/pyqs";

// The zod schemas are the source of truth; TypeScript types are inferred from them.

const baseSchema = z.object({
	name: z.string(),
	path: z.string(),
	parentPath: z.string(),
});

// How a file is listed and shown. Loader rules set it; "file" is the fallback
// for anything no rule claims (shown as a download page).
export const FILE_KINDS = ["file", "pdf", "doc"] as const;

const fileSchema = baseSchema.extend({
	type: z.literal("file"),
	kind: z.enum(FILE_KINDS),
	extension: z.string(),
	// Display title, e.g. from a markdown file's frontmatter
	title: z.string().optional(),
	// Set for files whose name follows the PYQ naming scheme
	pyq: pyqDataSchema.optional(),
});

// A child directory as listed by its parent (without its own contents).
const dirSummarySchema = baseSchema.extend({
	type: z.literal("dir"),
});

const dirSchema = dirSummarySchema.extend({
	directories: z.array(dirSummarySchema),
	files: z.array(fileSchema),
});

export const fsEntrySchema = z.discriminatedUnion("type", [
	dirSchema,
	fileSchema,
]);

export type FileKind = (typeof FILE_KINDS)[number];
export type FileEntry = z.infer<typeof fileSchema>;
export type DirSummary = z.infer<typeof dirSummarySchema>;
export type DirEntry = z.infer<typeof dirSchema>;
export type FsEntry = z.infer<typeof fsEntrySchema>;
export type PyqFileEntry = FileEntry & { pyq: PyqData };

export function isPyqFile(file: FileEntry): file is PyqFileEntry {
	return file.pyq !== undefined;
}

// Name shown in listings, crumbs and page titles.
export function displayName(file: FileEntry): string {
	return file.title ?? file.name;
}
