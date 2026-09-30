import { defineCollection } from "astro:content";
import { filesystemLoader } from "@/lib/content/loader";
import { pyqRules } from "@/lib/content/pyq-rules";

const fsEntryCollection = defineCollection({
	loader: filesystemLoader({
		root: "pyqs",
		rules: pyqRules,
	}),
});

export const collections = {
	fs: fsEntryCollection,
};
