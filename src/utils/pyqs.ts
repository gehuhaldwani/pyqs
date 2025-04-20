import type { Pyq } from "@/types/content";

const monthNames = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

function getPyqTitle(pyq: Pyq): string {
	return (
		pyq?.subject_code.toUpperCase() +
		" " +
		(pyq?.specialization_code
			? `- ${pyq?.specialization_code!.toUpperCase()} `
			: "") +
		"• " +
		(pyq?.set ? `Set ${pyq?.set} • ` : "") +
		(pyq?.type === "midsem" ? "Mid Sem" : "End Sem") +
		" " +
		(pyq?.back ? "BACK " : "") +
		"• " +
		pyq?.year +
		(pyq?.month ? ` ${monthNames[pyq?.month! - 1]}` : "") +
		(pyq?.date ? ` ${pyq?.date!}` : "")
	);
}

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

export { getPyqTitle, comparePyqs };
