import { describe, expect, test } from "bun:test";
import type { FsEntry } from "@/lib/content/schema";
import { Pyq } from "@/lib/pyqs";

function file(name: string): FsEntry<"file"> {
	return {
		type: "file",
		name,
		path: `/bca/sem 1/${name}.pdf`,
		parentPath: "/bca/sem 1/",
		extension: ".pdf",
		directories: undefined,
		files: undefined,
	};
}

const pyq = (name: string) => new Pyq(file(name));

describe("Pyq.validator", () => {
	test.each([
		"tcs101_midsem_2023",
		"tcs101_endsem_back_2023_jun_setA",
		"bba101_F1_midsem_2023_apr",
		"tcs101_tcs102_sessional_2_2024_mar_15",
	])("accepts %s", (name) => {
		expect(Pyq.validator(file(name))).toBe(true);
	});

	test.each([
		"TCS101_midsem_2023",
		"tcs101_final_2023",
		"tcs101_midsem_1999",
		"tcs101_midsem_2023_june",
		"notes",
	])("rejects %s", (name) => {
		expect(Pyq.validator(file(name))).toBe(false);
	});
});

describe("Pyq parsing", () => {
	test("parses every field", () => {
		const { data } = pyq("tcs102_tcs101_AI_sessional_2_back_2024_mar_15_setB");
		expect(data).toEqual({
			subjects: [
				{ subject_code: "tcs101", specialization_code: "AI" },
				{ subject_code: "tcs102", specialization_code: null },
			],
			type: "sessional",
			no: 2,
			back: true,
			year: 2024,
			month: 3,
			date: 15,
			set: "B",
		});
	});

	test("optional fields default to null/false", () => {
		const { data } = pyq("tcs101_midsem_2023");
		expect(data.no).toBeNull();
		expect(data.back).toBe(false);
		expect(data.month).toBeNull();
		expect(data.date).toBeNull();
		expect(data.set).toBeNull();
	});

	test("throws on invalid names", () => {
		expect(() => pyq("not_a_pyq")).toThrow("Invalid file name format");
	});
});

describe("Pyq.title", () => {
	test("single subject", () => {
		expect(pyq("tcs101_midsem_2023").title).toBe("TCS101 • Mid Sem");
	});

	test("multiple subjects, specialization, set, number and back", () => {
		expect(pyq("tcs101_F1_tcs102_endsem_2_back_2023_setA").title).toBe(
			"TCS101 - F1 • TCS102 • Set A • End Sem 2 BACK",
		);
	});

	test("has no double or trailing spaces", () => {
		const title = pyq("tcs101_AI_sessional_2023").title;
		expect(title).not.toMatch(/\s{2}|\s$|^\s/);
	});
});

describe("Pyq.dateString", () => {
	test.each([
		["tcs101_midsem_2023", "2023"],
		["tcs101_midsem_2023_apr", "2023 Apr"],
		["tcs101_midsem_2023_apr_7", "2023 Apr 7"],
	])("%s -> %s", (name, expected) => {
		expect(pyq(name).dateString).toBe(expected);
	});
});

describe("Pyq.compareTo", () => {
	const sign = (n: number) => Math.sign(n) || 0;

	test("orders by year, then month, then date", () => {
		expect(sign(pyq("tcs101_midsem_2022_dec").compareTo(pyq("tcs101_midsem_2023_jan")))).toBe(-1);
		expect(sign(pyq("tcs101_midsem_2023_jan").compareTo(pyq("tcs101_midsem_2023_feb")))).toBe(-1);
		expect(sign(pyq("tcs101_midsem_2023_jan_20").compareTo(pyq("tcs101_midsem_2023_jan_3")))).toBe(1);
	});

	test("missing month/date sort before present ones", () => {
		expect(sign(pyq("tcs101_midsem_2023").compareTo(pyq("tcs101_midsem_2023_jan")))).toBe(-1);
		expect(sign(pyq("tcs101_midsem_2023_jan").compareTo(pyq("tcs101_midsem_2023_jan_1")))).toBe(-1);
	});

	// Regression: papers with the same month and no date (or no month at all)
	// used to return -1 in both directions.
	test("is antisymmetric when month/date are missing on both sides", () => {
		const pairs = [
			["tcs101_midsem_2023", "tcs102_midsem_2023"],
			["tcs101_midsem_2023_may", "tcs102_midsem_2023_may"],
		];
		for (const [x, y] of pairs) {
			expect(sign(pyq(x).compareTo(pyq(y)))).toBe(-sign(pyq(y).compareTo(pyq(x))));
			expect(pyq(x).compareTo(pyq(y))).not.toBe(0);
		}
	});

	test("returns 0 only for equivalent papers", () => {
		expect(pyq("tcs101_midsem_2023").compareTo(pyq("tcs101_midsem_2023"))).toBe(0);
	});

	test("breaks date ties by exam type, number, back, subjects and set", () => {
		const ascending = [
			"tcs101_sessional_2023",
			"tcs101_midsem_2023",
			"tcs101_midsem_1_2023",
			"tcs101_midsem_2_2023",
			"tcs101_midsem_2_back_2023",
			"tcs101_endsem_2023",
			"tcs102_endsem_2023",
			"tcs102_endsem_2023_setA",
			"tcs102_endsem_2023_setB",
			"tcs101_tcs102_endsem_2023",
		];
		const shuffled = [...ascending].reverse();
		const sorted = shuffled.map(pyq).sort((a, b) => a.compareTo(b)).map((p) => p.entry.name);
		expect(sorted).toEqual(ascending);
	});

	test("sorting is independent of input order", () => {
		const names = [
			"tcs101_midsem_2023",
			"tcs102_midsem_2023",
			"tcs101_endsem_2023_may",
			"tcs101_F1_endsem_2023_may",
			"tcs101_midsem_2022_oct_3",
			"tcs101_midsem_2024",
		];
		const expected = names.map(pyq).sort((a, b) => a.compareTo(b)).map((p) => p.entry.name);
		for (let i = 0; i < 20; i++) {
			const shuffled = [...names].sort(() => Math.random() - 0.5);
			const sorted = shuffled.map(pyq).sort((a, b) => a.compareTo(b)).map((p) => p.entry.name);
			expect(sorted).toEqual(expected);
		}
	});
});
