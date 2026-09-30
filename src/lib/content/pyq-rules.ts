import { parsePyqName } from "@/lib/pyqs";
import type { LoaderRules } from "./rules";

// README.md documents the content repository and is not archive content.
const HIDDEN_MARKDOWN = new Set(["readme"]);

// Keeps PDFs that follow the naming scheme, and every markdown file except README as a doc.
// Everything else is skipped.
export const pyqRules: LoaderRules = {
	file: {
		".pdf": (entry) => {
			const pyq = parsePyqName(entry.name);
			return pyq ? { ...entry, kind: "pdf", pyq } : null;
		},
		".md": (entry) =>
			HIDDEN_MARKDOWN.has(entry.name.toLowerCase())
				? null
				: { ...entry, kind: "doc" },
		"*": () => null,
	},
};
