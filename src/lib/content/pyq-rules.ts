import { parsePyqName } from "@/lib/pyqs";
import type { LoaderRules } from "./rules";

// Repository metadata that is never listed (index.md is handled by the loader).
const HIDDEN_MARKDOWN = new Set(["readme"]);

// Loader rules for the PYQs archive:
// - PDFs that follow the naming scheme, with their parsed details
// - any other markdown file, as a "doc" page (no name filtering)
// - everything else is skipped
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
