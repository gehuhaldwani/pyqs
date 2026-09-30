import { describe, expect, test } from "bun:test";
import {
	comparePyqs,
	formatPyqDate,
	formatPyqTitle,
	type PyqData,
	parsePyqName,
	pyqDataSchema,
} from "@/lib/pyqs";

function pyq(name: string): PyqData {
	const data = parsePyqName(name);
	if (!data) throw new Error(`test fixture is not a valid PYQ name: ${name}`);
	return data;
}

describe("parsePyqName", () => {
	test.each([
		"tcs101_midsem_2023",
		"tcs101_endsem_back_2023_jun_setA",
		"bba101_F1_midsem_2023_apr",
		"tcs101_tcs102_sessional_2_2024_mar_15",
	])("accepts %s", (name) => {
		expect(parsePyqName(name)).not.toBeNull();
	});

	test.each([
		"TCS101_midsem_2023",
		"tcs101_final_2023",
		"tcs101_midsem_1999",
		"tcs101_midsem_2023_june",
		"notes",
	])("rejects %s", (name) => {
		expect(parsePyqName(name)).toBeNull();
	});

	test("parses every field", () => {
		expect(pyq("tcs102_tcs101_AI_sessional_2_back_2024_mar_15_setB")).toEqual({
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
		expect(pyq("tcs101_midsem_2023")).toMatchObject({
			no: null,
			back: false,
			month: null,
			date: null,
			set: null,
		});
	});

	test("output always satisfies the stored schema", () => {
		for (const name of [
			"tcs101_midsem_2023",
			"tcs102_tcs101_AI_sessional_2_back_2024_mar_15_setB",
		]) {
			expect(pyqDataSchema.parse(pyq(name))).toEqual(pyq(name));
		}
	});
});

describe("formatPyqTitle", () => {
	test("single subject", () => {
		expect(formatPyqTitle(pyq("tcs101_midsem_2023"))).toBe("TCS101 • Mid Sem");
	});

	test("multiple subjects, specialization, set, number and back", () => {
		expect(
			formatPyqTitle(pyq("tcs101_F1_tcs102_endsem_2_back_2023_setA")),
		).toBe("TCS101 - F1 • TCS102 • Set A • End Sem 2 BACK");
	});

	test("has no double or trailing spaces", () => {
		expect(formatPyqTitle(pyq("tcs101_AI_sessional_2023"))).not.toMatch(
			/\s{2}|\s$|^\s/,
		);
	});
});

describe("formatPyqDate", () => {
	test.each([
		["tcs101_midsem_2023", "2023"],
		["tcs101_midsem_2023_apr", "2023 Apr"],
		["tcs101_midsem_2023_apr_7", "2023 Apr 7"],
	])("%s -> %s", (name, expected) => {
		expect(formatPyqDate(pyq(name))).toBe(expected);
	});
});

describe("comparePyqs", () => {
	const cmp = (a: string, b: string) =>
		Math.sign(comparePyqs(pyq(a), pyq(b))) || 0;
	const sortNames = (names: string[]) =>
		names
			.map((name) => ({ name, data: pyq(name) }))
			.sort((a, b) => comparePyqs(a.data, b.data))
			.map((p) => p.name);

	test("orders by year, then month, then date", () => {
		expect(cmp("tcs101_midsem_2022_dec", "tcs101_midsem_2023_jan")).toBe(-1);
		expect(cmp("tcs101_midsem_2023_jan", "tcs101_midsem_2023_feb")).toBe(-1);
		expect(cmp("tcs101_midsem_2023_jan_20", "tcs101_midsem_2023_jan_3")).toBe(
			1,
		);
	});

	test("missing month/date sort before present ones", () => {
		expect(cmp("tcs101_midsem_2023", "tcs101_midsem_2023_jan")).toBe(-1);
		expect(cmp("tcs101_midsem_2023_jan", "tcs101_midsem_2023_jan_1")).toBe(-1);
	});

	// Regression test. Papers with the same month and no date, or no month, used to compare as -1 both ways.
	test("is antisymmetric when month/date are missing on both sides", () => {
		for (const [x, y] of [
			["tcs101_midsem_2023", "tcs102_midsem_2023"],
			["tcs101_midsem_2023_may", "tcs102_midsem_2023_may"],
		]) {
			expect(cmp(x, y)).toBe(-cmp(y, x));
			expect(cmp(x, y)).not.toBe(0);
		}
	});

	test("returns 0 only for equivalent papers", () => {
		expect(cmp("tcs101_midsem_2023", "tcs101_midsem_2023")).toBe(0);
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
		expect(sortNames([...ascending].reverse())).toEqual(ascending);
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
		const expected = sortNames(names);
		for (let i = 0; i < 20; i++) {
			expect(sortNames([...names].sort(() => Math.random() - 0.5))).toEqual(
				expected,
			);
		}
	});
});
