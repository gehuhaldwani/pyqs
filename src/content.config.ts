import { defineCollection } from "astro:content";
import { entrySchema } from "@/types/content";
import { entryLoader } from "@/utils/loader";

const entryCollection = defineCollection({
	loader: entryLoader(),
	schema: entrySchema,
});

export const collections = {
	entry: entryCollection,
};
