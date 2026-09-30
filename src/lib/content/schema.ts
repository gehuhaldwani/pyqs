import { z } from "astro/zod";
import { type PyqData, pyqDataSchema } from "@/lib/pyqs";

// The zod schemas are the source of truth; TypeScript types are inferred from them.

const baseSchema = z.object({
	name: z.string(),
	path: z.string(),
	parentPath: z.string(),
});

const fileSchema = baseSchema.extend({
	type: z.literal("file"),
	extension: z.string(),
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

export type FileEntry = z.infer<typeof fileSchema>;
export type DirSummary = z.infer<typeof dirSummarySchema>;
export type DirEntry = z.infer<typeof dirSchema>;
export type FsEntry = z.infer<typeof fsEntrySchema>;
export type PyqFileEntry = FileEntry & { pyq: PyqData };

export function isPyqFile(file: FileEntry): file is PyqFileEntry {
	return file.pyq !== undefined;
}
