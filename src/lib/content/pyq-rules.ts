import { parsePyqName } from "@/lib/pyqs";
import type { LoaderRules } from "./rules";

// Loader rules for the PYQs archive: keep only PDFs that follow the naming
// scheme, and store their parsed details on the entry.
export const pyqRules: LoaderRules = {
	file: {
		".pdf": (entry) => {
			const pyq = parsePyqName(entry.name);
			return pyq ? { ...entry, pyq } : null;
		},
		"*": () => null,
	},
};
