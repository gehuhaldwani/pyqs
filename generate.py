import os
import shutil
import configparser

ROOT_FOLDER = "pyqs"


def generate_md_files(root_folder, output_folder):
    config = configparser.ConfigParser()
    for foldername, subfolders, filenames in os.walk(root_folder):

        # ignore hidden folders
        subfolders[:] = [s for s in subfolders if not s.startswith(".")]
        # ignore hidden files
        filenames = [
            f for f in filenames if not f.startswith(".") or not f.contains(".")
        ]

        if filenames or subfolders:
            category_path = os.path.relpath(foldername, root_folder)
            # pdfs
            for filename in filenames:
                if filename.endswith(".pdf"):
                    pdf_title = os.path.splitext(filename)[0]
                    md_content = f"""---
title: {pdf_title}
pdf: ./{filename}
layout: pdf
---
"""
                    md_filename = os.path.join(
                        output_folder,
                        category_path,
                        f"{pdf_title}.md",
                    )

                    os.makedirs(os.path.dirname(md_filename), exist_ok=True)

                    with open(md_filename, "w") as md_file:
                        md_file.write(md_content)
            # directory folder
            index_md_content = f"""---
title: {os.path.basename(foldername)}
layout: explorer
entries:
"""
            for subfolder in sorted(subfolders):
                index_md_content += f"    - dir: {subfolder}\n"
            for filename in sorted(filenames):
                if filename.endswith(".pdf"):
                    index_md_content += f"    - pdf: {filename}\n"
                elif filename.endswith(".url"):
                    config.read(os.path.join(foldername, filename))
                    url = config["InternetShortcut"]["URL"]
                    index_md_content += f"    - url: {filename}::{url} \n"
                else:
                    index_md_content += f"    - file: {filename}\n"

            index_md_content += "---\n"

            index_md_filename = os.path.join(
                output_folder,
                category_path,
                "index.md",
            )

            os.makedirs(os.path.dirname(index_md_filename), exist_ok=True)

            with open(index_md_filename, "w") as index_md_file:
                index_md_file.write(index_md_content)


if __name__ == "__main__":
    folder = ROOT_FOLDER
    output_folder = "_" + folder
    # remove output folder if exists
    if os.path.exists(output_folder):
        shutil.rmtree(output_folder)
    generate_md_files(folder, output_folder)

    print("Markdown files generated successfully.")
