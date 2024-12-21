function toTitleCase(str: string): string {
	return str.replace(
		/\w\S*/g,
		(text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
	);
}

import type { Pyq } from "./types";

function comparePyqs(a: Pyq, b: Pyq): number {
	if (a === null && b === null) {
		return 0;
	}
	if (a === null) {
		return -1;
	}
	if (b === null) {
		return 1;
	}

	if (a.year !== b.year) {
		return a.year - b.year;
	}

	if (a.month !== null && b.month !== null) {
		if (a.month !== b.month) {
			return a.month - b.month;
		}
		if (a.date !== null && b.date !== null) {
			return a.date - b.date;
		}

		if (a.date === null) {
			return -1;
		}
		if (b.date === null) {
			return 1;
		}
	}

	if (a.month === null) {
		return -1;
	}
	if (b.month === null) {
		return 1;
	}

	const subject_code_cmp = a.subject_code.localeCompare(b.subject_code);
	if (subject_code_cmp !== 0) {
		return subject_code_cmp;
	}

	if (a.specialization_code !== null && b.specialization_code !== null) {
		return a.specialization_code.localeCompare(b.specialization_code);
	}
	if (a.specialization_code === null) {
		return -1;
	}
	if (b.specialization_code === null) {
		return 1;
	}

	return 0;
}

export { toTitleCase, comparePyqs };
