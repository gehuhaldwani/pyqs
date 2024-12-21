import os
import shutil
import configparser
import json
import re

file_name_pattern = ""
with open("pyqs.regex", "r") as file:
    file_name_pattern = file.read()

ROOT_FOLDER = "pyqs"

MONTHS: list[str] = [
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
]


class Pyq:
    def __init__(
        self,
        subject_code: str,
        specialization_code: str | None,
        type: str,
        back: bool,
        year: int,
        month: int | None,
        date: int | None,
        set: str | None,
    ):
        self.subject_code: str = subject_code
        self.specialization_code: str | None = specialization_code
        self.type: str = type
        self.back: bool = back
        self.year: int = year
        self.month: int | None = month
        self.date: int | None = date
        self.set: str | None = set

    def __str__(self):
        return (
            self.subject_code
            + "_"
            + (self.specialization_code + "_" if self.specialization_code else "")
            + self.type
            + "_"
            + ("back_" if self.back else "")
            + str(self.year)
            + "_"
            + (str(self.month) + "_" if self.month else "")
            + (str(self.date) + "_" if self.date else "")
            + (self.set + "_" if self.set else "")
        )


class Entry:
    def __init__(self, title: str, type: str, path: str, parent_path: str):
        self.title: str = title
        self.type: str = type
        self.path: str = path
        self.parent_path: str = parent_path
        self.entries: list[Entry] = []
        self.pyq: Pyq | None = None

    def add_entry(self, entry: "Entry"):
        self.entries.append(entry)


def write_json_file(
    entry: Entry, file_name: str, parent_folder: str, output_folder: str
):
    json_filename = os.path.join(
        output_folder,
        parent_folder,
        f"{file_name}.json",
    )

    os.makedirs(
        os.path.dirname(json_filename),
        exist_ok=True,
    )

    with open(json_filename, "w") as json_file:
        json.dump(
            entry,
            json_file,
            default=lambda o: o.__dict__,
            indent=4,
        )


def generate_json_files(root_folder, output_folder):
    config = configparser.ConfigParser()
    for foldername, subfolders, filenames in os.walk(root_folder):
        # ignore hidden folders
        subfolders[:] = [s for s in subfolders if not s.startswith(".")]
        # ignore hidden files and files without extension
        filenames = [f for f in filenames if f.find(".") > 0]

        if filenames or subfolders:
            category_path = os.path.relpath(foldername, root_folder)

            # directory folder
            index_entry = Entry(
                title=os.path.basename(foldername),
                type="dir",
                path=f"/{foldername.replace('\\','/')}/",
                parent_path=(
                    f"/{os.path.dirname(foldername).replace('\\','/')}/"
                    if os.path.dirname(foldername)
                    else "/"
                ),
            )

            for subfolder in sorted(subfolders):
                index_entry.add_entry(
                    Entry(
                        title=subfolder,
                        type="dir",
                        path=f"/{foldername.replace('\\','/')}/{subfolder.replace('\\','/')}/",
                        parent_path=f"/{foldername.replace('\\','/')}/",
                    )
                )

            for filename in sorted(filenames):
                if filename.endswith(".pdf"):
                    pdf_title = os.path.splitext(filename)[0]

                    match = re.match(file_name_pattern, pdf_title)
                    if match:
                        pdf_entry = Entry(
                            title=pdf_title,
                            type="pdf",
                            path=f"/{foldername.replace('\\','/')}/{filename}",
                            parent_path=(
                                f"/{foldername.replace('\\','/')}/"
                                if foldername
                                else "/"
                            ),
                        )
                        pdf_entry.pyq = Pyq(
                            subject_code=match.group("subject_code"),
                            specialization_code=match.group("specialization_code")
                            or None,
                            type=match.group("type"),
                            back=match.group("back") is not None,
                            year=int(match.group("year")),
                            month=(
                                MONTHS.index(match.group("month")) + 1
                                if match.group("month")
                                else None
                            ),
                            date=(
                                int(match.group("date"))
                                if match.group("date")
                                else None
                            ),
                            set=match.group("set") or None,
                        )

                        write_json_file(
                            pdf_entry, pdf_title, category_path, output_folder
                        )
                        index_entry.add_entry(pdf_entry)
                    else:
                        print(f"Invalid file name: {pdf_title}")

                elif filename.endswith(".url"):
                    config.read(os.path.join(foldername, filename))
                    url = config["InternetShortcut"]["URL"]
                    index_entry.add_entry(
                        Entry(
                            title=filename,
                            type="url",
                            path=url,
                            parent_path=f"/{foldername.replace('\\','/')}/",
                        )
                    )

                else:
                    index_entry.add_entry(
                        Entry(
                            title=filename,
                            type="file",
                            path=f"/{foldername.replace('\\','/')}/{filename}",
                            parent_path=f"/{foldername.replace('\\','/')}/",
                        )
                    )

            write_json_file(index_entry, "index", category_path, output_folder)


if __name__ == "__main__":
    folder = ROOT_FOLDER
    output_folder = "src/content/" + folder
    # remove output folder if exists
    if os.path.exists(output_folder):
        shutil.rmtree(output_folder)
    generate_json_files(folder, output_folder)

    print("JSON files generated successfully.")
