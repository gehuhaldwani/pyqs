import { z } from "astro:content";

const pyqSchema = z.object({
	subject_code: z.string(),
	specialization_code: z.string().nullable(),
	type: z.string(),
	back: z.boolean(),
	year: z.number(),
	month: z.number().nullable(),
	date: z.number().nullable(),
	set: z.string().nullable(),
});

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

const entrySchema = z.object({
	title: z.string(),
	type: z.string(),
	path: z.string(),
	parent_path: z.string().nullable(),
	entries: z.array(z.lazy(() => entrySchema)).optional(),
	pyq: pyqSchema.nullable(),
});

type Entry = {
	title: string;
	type: string;
	path: string;
	parent_path: string | null;
	entries: Entry[] | null;
	pyq: Pyq | null;
};

export { entrySchema, pyqSchema };
export type { Entry, Pyq };
