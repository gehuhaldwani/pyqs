import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { entrySchema } from "@/utils/types";

const entryCollection = defineCollection({
	loader: glob({ pattern: "**/[^_]*.json", base: "./src/content/pyqs" }),
	schema: entrySchema,
});

export const collections = {
	entries: entryCollection,
};
