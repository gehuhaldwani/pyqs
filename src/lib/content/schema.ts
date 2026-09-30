import { z } from "astro/zod";
import { type PyqData, pyqDataSchema } from "@/lib/pyqs";

// The types below are inferred from these schemas, so change the schemas, not the types.

const baseSchema = z.object({
	name: z.string(),
	path: z.string(),
	parentPath: z.string(),
});

// Loader rules set the kind. "file" is the fallback, and its page is a download link.
export const FILE_KINDS = ["file", "pdf", "doc"] as const;

const fileSchema = baseSchema.extend({
	type: z.literal("file"),
	kind: z.enum(FILE_KINDS),
	extension: z.string(),
	// From a markdown file's frontmatter.
	title: z.string().optional(),
	// Set for files whose name follows the PYQ naming scheme.
	pyq: pyqDataSchema.optional(),
});

// How a parent directory lists a child, without the child's contents.
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

export function displayName(file: FileEntry): string {
	return file.title ?? file.name;
}
