from operator import ne
import os
import shutil


def generate_md_files(root_folder, output_folder):
    for foldername, subfolders, filenames in os.walk(root_folder):
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
                        root_folder,
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
                else:
                    index_md_content += f"    - file: {filename}\n"

            index_md_content += "---\n"

            index_md_filename = os.path.join(
                output_folder, root_folder, category_path, "index.md"
            )

            os.makedirs(os.path.dirname(index_md_filename), exist_ok=True)

            with open(index_md_filename, "w") as index_md_file:
                index_md_file.write(index_md_content)


if __name__ == "__main__":
    output_folder = "./_pyqs"
    home_index_md_content = f"""---
title: Home
layout: explorer
entries:
"""
    # remove output folder if exists
    if os.path.exists(output_folder):
        shutil.rmtree(output_folder)

    # for folder in current directory
    for folder in os.listdir():
        if (
            os.path.isdir(folder)
            and folder[0].isalpha()
            and folder not in ["assets", "vendor"]
        ):
            generate_md_files(folder, output_folder)
            home_index_md_content += f"    - dir: {folder}\n"

    home_index_md_content += "---\n"
    with open(os.path.join(output_folder, "index.md"), "w") as home_index_md_file:
        home_index_md_file.write(home_index_md_content)

    print("Markdown files generated successfully.")
