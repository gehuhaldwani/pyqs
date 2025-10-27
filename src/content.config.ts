import { defineCollection } from "astro:content";
import { filesystemLoader } from "@/lib/content/loader";
import { Pyq } from "@/lib/pyqs";


const fsEntryCollection = defineCollection({
	loader: filesystemLoader({
		root: "pyqs",
		validators: {
			file: {
				".pdf": Pyq.validator,
				"*": (_) => false,
			}
		},
	}),
});

export const collections = {
	fs: fsEntryCollection,
};
