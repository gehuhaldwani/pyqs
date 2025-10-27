import { z } from "astro:content";

export interface FsEntry<T extends "dir" | "file"> {
    type: T;
    name: string;
    path: string;
    parentPath?: string;
    // dir specific
    directories: T extends "dir" ? FsEntry<"dir">[] : undefined;
    files: T extends "dir" ? FsEntry<"file">[] : undefined;
    // file specific
    extension?: T extends "file" ? string : undefined;
}

// zod schema

const baseSchema = z.object({
    name: z.string(),
    path: z.string(),
    parentPath: z.string().optional(),
    // dir specific
    directories: z.undefined(),
    files: z.undefined(),
    // file specific
    extension: z.undefined(),
});

const fileSchema = baseSchema.extend({
    type: z.literal("file"),
    extension: z.string().optional(),
});

const dirSchema: any = baseSchema.extend({
    type: z.literal("dir"),
    directories: z.array(z.lazy(() => dirSchema)),
    files: z.array(fileSchema),
});

export const fsEntrySchema = z.discriminatedUnion("type", [
    dirSchema,
    fileSchema,
]);