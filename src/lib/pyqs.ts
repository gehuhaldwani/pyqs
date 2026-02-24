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

class Pyq {
	static $pattern =
		/^(?<subjects>(?:(?:[a-z]+[A-Z0-9]+)_(?:(?:[A-Z0-9]+)_)?)+)(?<type>(?:midsem)|(?:endsem))_(?:(?<back>back)_)?(?<year>20[0-9]{2})(?:_(?<month>(?:jan)|(?:feb)|(?:mar)|(?:apr)|(?:may)|(?:jun)|(?:jul)|(?:aug)|(?:sep)|(?:oct)|(?:nov)|(?:dec)))?(?:_(?<date>[0-9]{1,2}))?(?:_set(?<set>[A-Z0-9]+))?$/;

	data: {
		subjects: {
			subject_code: string;
			specialization_code: string | null
			}[];
		type: string;
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
			throw new Error(`Invalid file name format: ${entry.name}, validation: ${Pyq.validator(entry)}`);
		}

		this.entry = entry;
		this.data = {
			subjects: match.groups?.subjects?.match(/([a-z]+[A-Z0-9]+)_(?:(?:[A-Z0-9]+)_)?/g)?.map((subject) => {
				const [subject_code, specialization_code] = subject.split("_");
				return {
					subject_code,
					specialization_code: specialization_code || null,
				};
			}).sort((a, b) => a.subject_code.localeCompare(b.subject_code)) || [],
			type: match.groups?.type || "",
			back: match.groups?.back !== undefined,
			year: Number.parseInt(match.groups?.year || "", 10),
			month: match.groups?.month
				? months.indexOf(match.groups.month) + 1
				: null,
			date: match.groups?.date
				? Number.parseInt(match.groups.date, 10)
				: null,
			set: match.groups?.set || null,
		};
	}

	static validator(entry: FsEntry<"file">): boolean {
		return Pyq.$pattern.test(entry.name);
	}

	get title(): string {
		return (
			this.data.subjects.map((subject) => {
				return (
					subject.subject_code.toUpperCase() +
					" " +
					(subject.specialization_code
						? `- ${subject.specialization_code?.toUpperCase()} `
						: "")
				);
			}).join(" • ") + 
			"• " +
			(this.data.set ? `Set ${this.data.set} • ` : "") +
			(this.data.type === "midsem" ? "Mid Sem" : "End Sem") +
			" " +
			(this.data.back ? "BACK " : "")
		);
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

	compareTo(other: Pyq): number {
		// Compare year
		if (this.data.year !== other.data.year) {
			return this.data.year - other.data.year;
		}

		// Compare month
		if (this.data.month !== null && other.data.month !== null) {
			if (this.data.month !== other.data.month) {
				return this.data.month - other.data.month;
			}
			if (this.data.date !== null && other.data.date !== null) {
				return this.data.date - other.data.date;
			}

			if (this.data.date === null) {
				return -1;
			}
			if (other.data.date === null) {
				return 1;
			}
		}
		// If one month is null
		if (this.data.month === null) {
			return -1;
		}
		if (other.data.month === null) {
			return 1;
		}

		// compare subjects length
		if (this.data.subjects.length !== other.data.subjects.length) {
			return this.data.subjects.length - other.data.subjects.length;
		}

		// Compare subject codes
		const subject_code_cmp = this.data.subjects[0].subject_code.localeCompare(other.data.subjects[0].subject_code);
		if (subject_code_cmp !== 0) {
			return subject_code_cmp;
		}

		// Compare specialization codes
		if (this.data.subjects[0].specialization_code !== null && other.data.subjects[0].specialization_code !== null) {
			return this.data.subjects[0].specialization_code.localeCompare(other.data.subjects[0].specialization_code);
		}
		// If one specialization code is null
		if (this.data.subjects[0].specialization_code === null) {
			return -1;
		}
		if (other.data.subjects[0].specialization_code === null) {
			return 1;
		}

		return 0;
	}
}

export { Pyq };