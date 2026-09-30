import { describe, expect, test } from "bun:test";
import {
	encodePath,
	githubRawUrl,
	pdfThumbnailPath,
	sitemapIndexUrl,
	uploaderUrl,
} from "@/utils/links";

describe("encodePath", () => {
	test("encodes each segment and keeps slashes", () => {
		expect(encodePath("/ba jmc/sem 4/radio production & podcast/a#b?.pdf")).toBe(
			"/ba%20jmc/sem%204/radio%20production%20%26%20podcast/a%23b%3F.pdf",
		);
	});
});

describe("githubRawUrl", () => {
	test("builds an encoded raw.githubusercontent URL", () => {
		expect(githubRawUrl("gehuhaldwani/pyqs", "main", "/bca/sem 1/tcs101_midsem_2023.pdf")).toBe(
			"https://raw.githubusercontent.com/gehuhaldwani/pyqs/main/bca/sem%201/tcs101_midsem_2023.pdf",
		);
	});

	test("adds a leading slash when missing", () => {
		expect(githubRawUrl("o/r", "main", "a.pdf")).toBe(
			"https://raw.githubusercontent.com/o/r/main/a.pdf",
		);
	});

	test("does not strip a 'pyqs' folder from the path", () => {
		expect(githubRawUrl("o/r", "main", "/pyqs stuff/a.pdf")).toBe(
			"https://raw.githubusercontent.com/o/r/main/pyqs%20stuff/a.pdf",
		);
	});
});

describe("pdfThumbnailPath", () => {
	test.each([
		["/a/x.pdf", "/a/x.webp"],
		["/a/x.PDF", "/a/x.webp"],
		["/a.pdf dir/x.pdf", "/a.pdf dir/x.webp"],
	])("%s -> %s", (input, expected) => {
		expect(pdfThumbnailPath(input)).toBe(expected);
	});
});

describe("uploaderUrl", () => {
	test("encodes query values so '&' in folder names survives", () => {
		const url = new URL(
			uploaderUrl("/pyqs/ba jmc/sem 4/radio production & podcast/", "SEM 4 > RADIO & PODCAST"),
		);
		expect(url.origin).toBe("https://pyqs-uploader.pages.dev");
		expect(url.searchParams.get("path")).toBe("/pyqs/ba jmc/sem 4/radio production & podcast/");
		expect(url.searchParams.get("title")).toBe("SEM 4 > RADIO & PODCAST");
		expect([...url.searchParams.keys()]).toEqual(["path", "title"]);
	});
});

describe("sitemapIndexUrl", () => {
	test("includes the base path", () => {
		expect(sitemapIndexUrl("https://haldwani.gehu.in", "/pyqs/").href).toBe(
			"https://haldwani.gehu.in/pyqs/sitemap-index.xml",
		);
	});

	test("handles a base without a trailing slash and a root base", () => {
		expect(sitemapIndexUrl(new URL("https://example.com"), "/pyqs").href).toBe(
			"https://example.com/pyqs/sitemap-index.xml",
		);
		expect(sitemapIndexUrl("https://example.com", "/").href).toBe(
			"https://example.com/sitemap-index.xml",
		);
	});
});
