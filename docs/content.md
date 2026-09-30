# Content

The papers live on the `main` branch of [gehuhaldwani/pyqs](https://github.com/gehuhaldwani/pyqs). Locally, that branch is cloned into the `pyqs/` folder. Every folder becomes a page, and every file the site recognizes becomes a page inside it.

## What the site shows

| File | Shown as |
| --- | --- |
| A folder | A folder page listing its contents |
| `index.md` in a folder | Text below that folder's listing |
| A PDF that follows the naming scheme | A paper, opened in the PDF viewer |
| Any other `.md` file | A doc page with the rendered markdown |
| `README.md` | Nothing. It documents the repository. |
| Anything else, including misnamed PDFs | Nothing. The build lists these files. |

Folders with nothing to show are left out. A folder with only an `index.md` or a doc still shows.

## Naming papers

A paper's file name carries its details. The site parses them to build its title, date and sort order.

```text
subject[_SPECIALIZATION]..._type[_number][_back]_year[_month][_date][_setX].pdf
```

| Part | Format | Example |
| --- | --- | --- |
| Subject code | Lowercase letters, then digits or capitals | `tcs101` |
| Specialization | Optional, capitals or digits, after a subject | `F1` |
| Type | `midsem`, `endsem` or `sessional` | `endsem` |
| Number | Optional, one digit | `2` |
| Back paper | Optional, the word `back` | `back` |
| Year | Four digits starting with 20 | `2023` |
| Month | Optional, three lowercase letters | `jun` |
| Date | Optional, one or two digits | `15` |
| Set | Optional, `set` and then capitals or digits | `setA` |

Examples:

- `tcs101_midsem_2023.pdf`
- `tcs101_endsem_back_2023_jun_setA.pdf`
- `bba101_F1_midsem_2023_apr.pdf`

A paper can cover more than one subject: `tcs101_tcs102_endsem_2023.pdf`. The contribution guide at `src/pages/contribute.md` explains the same scheme to students, and a test checks that its examples parse.

Folders list papers newest first. For papers from the same date, end sem comes before mid sem, and mid sem before sessional. After that, the number, back paper, subjects and set decide the order.

## Folder names

Folder pages use the folder name in their title. A few names get special handling in `ExplorerLayout.astro` and `DirectoryEntry.astro`:

- `MID`, `END`, `OTHERS` and names containing `YEAR ` add the parent folder to the page title, such as `btech > Year 1`.
- `OLD` and names containing `SEM ` add the two parent folders.
- `OTHERS` and `OLD` get a gray folder icon.

## Docs

Any markdown file other than `index.md` and `README.md` becomes a doc. Its page shows the path crumbs and the rendered markdown, without a file list. Docs appear in their folder's listing above the papers.

A doc's name comes from its frontmatter, or from its file name if there is no title:

```md
---
title: Soft Computing Syllabus
---

## Units
```

Only plain markdown works. MDX components don't render in docs.

## Skipped files

Each build ends its content step with a summary like this one:

```text
Left out 2 empty directories:
    /bhm/sem 7/food production management 2 a/
    /btech/CSE/sem 6/OTHERS/
Skipped 4 files that did not match the loader rules:
  (no extension) (1)
    /LICENSE
  .md (1)
    /README.md
  .pdf (2)
    /bhm/sem 7/food production management 2 a/BHM701 .pdf
    /btech/CSE/sem 6/OTHERS/tcs 604 (4).pdf
```

The PDFs in this list don't follow the naming scheme. Renaming them puts them, and any folders left out because of them, back on the site.

## Thumbnails

The `thumb.yml` workflow on `main` renders the first page of each new or changed PDF as a 512x512 WebP image and commits it to the `thumbnails` branch. PDF pages use it as their link preview image.
