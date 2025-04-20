import { entrySchema, type Entry } from "@/types/content";
import type { Loader, LoaderContext } from "astro/loaders";
import fs from "node:fs/promises";
import path from "node:path";

const fileNamePattern =
	/^(?<subject_code>[a-zA-Z0-9]+)_(?:(?<specialization_code>[a-zA-Z0-9]+)_)?(?<type>(?:midsem)|(?:endsem))_(?:(?<back>back)_)?(?<year>20[0-9]{2})(?:_(?<month>(?:jan)|(?:feb)|(?:mar)|(?:apr)|(?:may)|(?:jun)|(?:jul)|(?:aug)|(?:sep)|(?:oct)|(?:nov)|(?:dec)))?(?:_(?<date>[0-9]{1,2}))?(?:_set(?<set>[a-zA-Z0-9]+))?$/;

const ROOT_FOLDER = "pyqs";
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

export function entryLoader(): Loader {
	return {
		name: "entry-loader",
		schema: entrySchema,
		async load(context) {
			context.logger.info("Loading PYQ content");

			await processDirectory({
				dirPath: ROOT_FOLDER,
				relativePath: "",
				context,
			});

			context.logger.info("PYQ content loading completed");
		},
	};
}

async function processDirectory({
	dirPath,
	relativePath,
	context,
}: {
	dirPath: string;
	relativePath: string;
	context: LoaderContext;
}) {
	try {
		const entries = await fs.readdir(path.join(process.cwd(), dirPath), {
			withFileTypes: true,
		});

		// Create directory entry
		const dirName = path.basename(dirPath);
		const dirRelativePath =
			`/${relativePath.replaceAll(/\\/g, "/")}/`.replaceAll("//", "/");
		const parentPath =
			dirRelativePath === "/"
				? "/"
				: `/${path.dirname(relativePath || "/").replaceAll(/\\/g, "/")}/`;

		const dirEntry: { id: string; data: Entry } = {
			id: dirRelativePath,
			data: {
				title: dirName,
				type: "dir",
				path: dirRelativePath,
				parent_path: parentPath,
				entries: [],
				pyq: null,
			},
		};

		// Filter out hidden files/directories
		const visibleEntries = entries.filter(
			(entry) => !entry.name.startsWith("."),
		);

		// Process subdirectories first
		for (const entry of visibleEntries.filter((e) => e.isDirectory())) {
			const subDirPath = `/${path
				.join(dirRelativePath, entry.name)
				.replaceAll(/\\/g, "/")}/`.replaceAll("//", "/");

			// Add subdirectory to entries
			dirEntry.data.entries.push({
				title: entry.name,
				type: "dir",
				path: subDirPath,
				parent_path: dirRelativePath,
				entries: [],
				pyq: null,
			});

			// Process subdirectory recursively
			await processDirectory({
				dirPath: path.join(dirPath, entry.name),
				relativePath: relativePath
					? `${relativePath}/${entry.name}`
					: entry.name,
				context,
			});
		}

		// Process files
		for (const entry of visibleEntries.filter((e) => e.isFile())) {
			if (entry.name.endsWith(".pdf")) {
				const pdfTitle = path.basename(entry.name, ".pdf");
				const match = fileNamePattern.exec(pdfTitle);

				if (match) {
					const pdfRelativePath = path
						.join(dirRelativePath, entry.name)
						.replaceAll(/\\/g, "/");

					const pdfEntry: Entry = {
						title: pdfTitle,
						type: "pdf",
						path: pdfRelativePath,
						parent_path: dirRelativePath,
						entries: [],
						pyq: {
							subject_code: match.groups?.subject_code || "",
							specialization_code: match.groups?.specialization_code || null,
							type: match.groups?.type || "",
							back: match.groups?.back !== undefined,
							year: Number.parseInt(match.groups?.year || ""),
							month: match.groups?.month
								? MONTHS.indexOf(match.groups.month) + 1
								: null,
							date: match.groups?.date
								? Number.parseInt(match.groups.date)
								: null,
							set: match.groups?.set || null,
						},
					};

					// Add PDF entry to directory entries
					dirEntry.data.entries.push(pdfEntry);

					// Store PDF entry in content collection
					context.store.set({
						id: pdfRelativePath,
						data: pdfEntry,
					});
				} else {
					context.logger.warn(`Invalid file name: ${pdfTitle}`);
				}
			} else if (entry.name.endsWith(".url")) {
				// Process URL shortcuts similar to your Python code
				// You'll need to parse the .url file to extract the URL
				const fileContent = await fs.readFile(
					path.join(dirPath, entry.name),
					"utf-8",
				);
				const urlMatch = fileContent.match(/URL=(.+)/);
				if (urlMatch) {
					const url = urlMatch[1];
					dirEntry.data.entries.push({
						title: entry.name,
						type: "url",
						path: url,
						parent_path: dirRelativePath,
						entries: [],
						pyq: null,
					});
				}
			} else if (entry.name.includes(".")) {
				// Process other files
				// dirEntry.data.entries.push({
				// 	title: entry.name,
				// 	type: "file",
				// 	path: `/${path.join(dirRelativePath, entry.name).replaceAll(/\\/g, "/")}`.replaceAll(
				// 		"//",
				// 		"/",
				// 	),
				// 	parent_path: dirRelativePath,
				// 	entries: [],
				// 	pyq: null,
				// });
			}
		}

		// Store directory entry
		context.store.set(dirEntry);
	} catch (error) {
		context.logger.error(`Error processing directory ${dirPath}: ${error}`);
	}
}
