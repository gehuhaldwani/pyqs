import { z, defineCollection } from "astro:content";

const pyqsCollection = defineCollection({
	type: "data",
	schema: z.object({
		title: z.string(),
		type: z.string(),
		path: z.string(),
		parent_path: z.string().nullable(),
		entries: z
			.array(
				z.object({
					type: z.string(),
					title: z.string(),
					path: z.string(),
				})
			)
			.optional(),
	}),
});

export const collections = {
	pyqs: pyqsCollection,
};
