import { describe, expect, test } from "bun:test";
import { folderTrail, parseStarred, toggleStarred } from "@/lib/starred";

describe("folderTrail", () => {
	test("lists the folders and leaves out the file", () => {
		expect(folderTrail("/b pharma/sem 2/biochemistry/bp203.pdf")).toEqual([
			"b pharma",
			"sem 2",
			"biochemistry",
		]);
		expect(folderTrail("/a.pdf")).toEqual([]);
	});
});

const paper = { path: "/bca/sem 1/a.pdf", title: "BCA101", detail: "End Sem" };

describe("parseStarred", () => {
	test("returns nothing for missing or broken values", () => {
		expect(parseStarred(null)).toEqual([]);
		expect(parseStarred("not json")).toEqual([]);
		expect(parseStarred('{"path":"/a"}')).toEqual([]);
	});

	test("keeps valid files and drops malformed ones and duplicates", () => {
		const raw = JSON.stringify([
			{ ...paper, starredAt: 2 },
			{ path: "/b.pdf" },
			{ ...paper, starredAt: 1 },
			{ path: "/c.pdf", title: "C", starredAt: 3 },
		]);
		expect(parseStarred(raw)).toEqual([
			{ ...paper, starredAt: 2 },
			{ path: "/c.pdf", title: "C", starredAt: 3 },
		]);
	});
});

describe("toggleStarred", () => {
	test("adds a new file first", () => {
		const existing = [{ path: "/x.pdf", title: "X", starredAt: 1 }];
		expect(toggleStarred(existing, paper, 5)).toEqual([
			{ ...paper, starredAt: 5 },
			...existing,
		]);
	});

	test("removes a starred file", () => {
		const files = [{ ...paper, starredAt: 1 }];
		expect(toggleStarred(files, paper, 5)).toEqual([]);
	});
});
