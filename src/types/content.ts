import { z } from "astro:content";

type Pyq = {
	subject_code: string;
	specialization_code: string | null;
	type: string;
	back: boolean;
	year: number;
	month: number | null;
	date: number | null;
	set: string | null;
};

const pyqSchema: z.ZodType<Pyq> = z.object({
	subject_code: z.string(),
	specialization_code: z.string().nullable(),
	type: z.string(),
	back: z.boolean(),
	year: z.number(),
	month: z.number().nullable(),
	date: z.number().nullable(),
	set: z.string().nullable(),
});

type Entry = {
	title: string;
	type: "dir" | "file" | "url" | "pdf";
	path: string;
	parent_path: string;
	entries: Entry[];
	pyq: Pyq | null;
};

const entrySchema: z.ZodType<Entry> = z.object({
	title: z.string(),
	type: z.enum(["dir", "file", "url", "pdf"]),
	path: z.string(),
	parent_path: z.string(),
	entries: z.array(z.lazy(() => entrySchema)),
	pyq: pyqSchema.nullable(),
});

export type { Pyq, Entry };
export { pyqSchema, entrySchema };
