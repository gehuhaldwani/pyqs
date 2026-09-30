import { z } from "astro/zod";
import { toTitleCase } from "@/utils/string";

const MONTHS = [
	"jan",
	"feb",
	"mar",
	"apr",
	"may",
	"jun",
	"jul",
	"aug",
	"sep",
	"oct",
	"nov",
	"dec",
];

const EXAM_TYPES = ["midsem", "endsem", "sessional"] as const;

type ExamType = (typeof EXAM_TYPES)[number];

// Order used when two papers share the same date.
const EXAM_TYPE_ORDER: ExamType[] = ["sessional", "midsem", "endsem"];

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
	midsem: "Mid Sem",
	endsem: "End Sem",
	sessional: "Sessional",
};

const PYQ_NAME_PATTERN =
	/^(?<subjects>(?:(?:[a-z]+[A-Z0-9]+)_(?:(?:[A-Z0-9]+)_)?)+)(?<type>(?:midsem)|(?:endsem)|(?:sessional))_(?:(?<no>[0-9])_)?(?:(?<back>back)_)?(?<year>20[0-9]{2})(?:_(?<month>(?:jan)|(?:feb)|(?:mar)|(?:apr)|(?:may)|(?:jun)|(?:jul)|(?:aug)|(?:sep)|(?:oct)|(?:nov)|(?:dec)))?(?:_(?<date>[0-9]{1,2}))?(?:_set(?<set>[A-Z0-9]+))?$/;

const subjectSchema = z.object({
	subject_code: z.string(),
	specialization_code: z.string().nullable(),
});

// The loader parses this from a paper's file name and stores it on the entry.
const pyqDataSchema = z.object({
	subjects: z.array(subjectSchema).min(1),
	type: z.enum(EXAM_TYPES),
	no: z.number().int().nullable(),
	back: z.boolean(),
	year: z.number().int(),
	month: z.number().int().nullable(),
	date: z.number().int().nullable(),
	set: z.string().nullable(),
});

type Subject = z.infer<typeof subjectSchema>;
type PyqData = z.infer<typeof pyqDataSchema>;

// Takes a file name without its extension. Returns null if it doesn't follow the naming scheme.
function parsePyqName(name: string): PyqData | null {
	const groups = PYQ_NAME_PATTERN.exec(name)?.groups;
	if (!groups) {
		return null;
	}

	const subjects = (
		groups.subjects.match(/[a-z]+[A-Z0-9]+_(?:[A-Z0-9]+_)?/g) ?? []
	)
		.map((subject) => {
			const [subject_code, specialization_code] = subject.split("_");
			return {
				subject_code,
				specialization_code: specialization_code || null,
			};
		})
		.sort((a, b) => a.subject_code.localeCompare(b.subject_code));

	return {
		subjects,
		type: groups.type as ExamType,
		no: groups.no ? Number.parseInt(groups.no, 10) : null,
		back: groups.back !== undefined,
		year: Number.parseInt(groups.year, 10),
		month: groups.month ? MONTHS.indexOf(groups.month) + 1 : null,
		date: groups.date ? Number.parseInt(groups.date, 10) : null,
		set: groups.set || null,
	};
}

function formatPyqTitle(pyq: PyqData): string {
	const subjects = pyq.subjects.map(({ subject_code, specialization_code }) =>
		specialization_code
			? `${subject_code.toUpperCase()} - ${specialization_code.toUpperCase()}`
			: subject_code.toUpperCase(),
	);
	const exam = [EXAM_TYPE_LABELS[pyq.type], pyq.no, pyq.back ? "BACK" : null]
		.filter((part) => part !== null)
		.join(" ");

	return [...subjects, pyq.set ? `Set ${pyq.set}` : null, exam]
		.filter((part) => part !== null)
		.join(" • ");
}

function formatPyqDate(pyq: PyqData): string {
	return [
		pyq.year,
		pyq.month ? toTitleCase(MONTHS[pyq.month - 1]) : null,
		pyq.date,
	]
		.filter((part) => part !== null)
		.join(" ");
}

// Missing values sort before present ones.
function compareNullable<T>(
	a: T | null,
	b: T | null,
	compare: (a: T, b: T) => number,
): number {
	if (a === null || b === null) {
		return a === b ? 0 : a === null ? -1 : 1;
	}
	return compare(a, b);
}

const compareNumbers = (a: number, b: number) => a - b;
const compareStrings = (a: string, b: string) => a.localeCompare(b);

function compareSubjects(a: Subject[], b: Subject[]): number {
	if (a.length !== b.length) {
		return a.length - b.length;
	}
	for (let i = 0; i < a.length; i++) {
		const cmp =
			compareStrings(a[i].subject_code, b[i].subject_code) ||
			compareNullable(
				a[i].specialization_code,
				b[i].specialization_code,
				compareStrings,
			);
		if (cmp !== 0) {
			return cmp;
		}
	}
	return 0;
}

// Oldest first. Every field takes part, so sorting gives the same order on every build.
function comparePyqs(a: PyqData, b: PyqData): number {
	return (
		a.year - b.year ||
		compareNullable(a.month, b.month, compareNumbers) ||
		compareNullable(a.date, b.date, compareNumbers) ||
		EXAM_TYPE_ORDER.indexOf(a.type) - EXAM_TYPE_ORDER.indexOf(b.type) ||
		compareNullable(a.no, b.no, compareNumbers) ||
		Number(a.back) - Number(b.back) ||
		compareSubjects(a.subjects, b.subjects) ||
		compareNullable(a.set, b.set, compareStrings)
	);
}

export type { ExamType, PyqData, Subject };
export {
	comparePyqs,
	formatPyqDate,
	formatPyqTitle,
	PYQ_NAME_PATTERN,
	parsePyqName,
	pyqDataSchema,
};
