import { toTitleCase } from "@/utils/string";
import type { FsEntry } from "./content/schema";

const months = [
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

type ExamType = "midsem" | "endsem" | "sessional";

// Order used when two papers share the same date.
const EXAM_TYPE_ORDER: ExamType[] = ["sessional", "midsem", "endsem"];

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
	midsem: "Mid Sem",
	endsem: "End Sem",
	sessional: "Sessional",
};

type Subject = {
	subject_code: string;
	specialization_code: string | null;
};

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

class Pyq {
	static $pattern =
		/^(?<subjects>(?:(?:[a-z]+[A-Z0-9]+)_(?:(?:[A-Z0-9]+)_)?)+)(?<type>(?:midsem)|(?:endsem)|(?:sessional))_(?:(?<no>[0-9])_)?(?:(?<back>back)_)?(?<year>20[0-9]{2})(?:_(?<month>(?:jan)|(?:feb)|(?:mar)|(?:apr)|(?:may)|(?:jun)|(?:jul)|(?:aug)|(?:sep)|(?:oct)|(?:nov)|(?:dec)))?(?:_(?<date>[0-9]{1,2}))?(?:_set(?<set>[A-Z0-9]+))?$/;

	data: {
		subjects: Subject[];
		type: ExamType;
		no: number | null;
		back: boolean;
		year: number;
		month: number | null;
		date: number | null;
		set: string | null;
	}

	entry: FsEntry<"file">;

	constructor(entry: FsEntry<"file">) {
		const match = Pyq.$pattern.exec(entry.name);

		if (!match || !match.groups) {
			throw new Error(`Invalid file name format: ${entry.name}`);
		}

		this.entry = entry;
		this.data = {
			subjects: match.groups.subjects.match(/([a-z]+[A-Z0-9]+)_(?:(?:[A-Z0-9]+)_)?/g)?.map((subject) => {
				const [subject_code, specialization_code] = subject.split("_");
				return {
					subject_code,
					specialization_code: specialization_code || null,
				};
			}).sort((a, b) => a.subject_code.localeCompare(b.subject_code)) || [],
			type: match.groups.type as ExamType,
			no: match.groups.no ? Number.parseInt(match.groups.no, 10) : null,
			back: match.groups.back !== undefined,
			year: Number.parseInt(match.groups.year, 10),
			month: match.groups.month
				? months.indexOf(match.groups.month) + 1
				: null,
			date: match.groups.date
				? Number.parseInt(match.groups.date, 10)
				: null,
			set: match.groups.set || null,
		};
	}

	static validator(entry: FsEntry<"file">): boolean {
		return Pyq.$pattern.test(entry.name);
	}

	toString(): string {
		return this.title;
	}

	get title(): string {
		const subjects = this.data.subjects.map(({ subject_code, specialization_code }) =>
			specialization_code
				? `${subject_code.toUpperCase()} - ${specialization_code.toUpperCase()}`
				: subject_code.toUpperCase(),
		);
		const exam = [
			EXAM_TYPE_LABELS[this.data.type],
			this.data.no,
			this.data.back ? "BACK" : null,
		].filter((part) => part !== null).join(" ");

		return [
			...subjects,
			this.data.set ? `Set ${this.data.set}` : null,
			exam,
		].filter((part) => part !== null).join(" • ");
	}

	get dateString(): string {
		return (
			this.data.year +
			(this.data.month
				? ` ${toTitleCase(months[this.data.month - 1])}`
				: "") +
			(this.data.date ? ` ${this.data.date}` : "")
		);
	}

	// Ascending chronological order; a total order, so sorting is deterministic.
	compareTo(other: Pyq): number {
		const a = this.data;
		const b = other.data;
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
}

export { Pyq };
