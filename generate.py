import os


def generate_md_files(root_folder, output_folder):
    for foldername, subfolders, filenames in os.walk(root_folder):
        if filenames or subfolders:
            category_path = os.path.relpath(foldername, root_folder)
            # pdfs
            for filename in filenames:
                if filename.endswith(".pdf"):
                    pdf_path = os.path.join(foldername, filename)
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
                        f'{pdf_title.lower().replace(" ", "_")}.md',
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
            for subfolder in subfolders:
                index_md_content += f"  - dir: {subfolder}\n"
            for filename in filenames:
                if filename.endswith(".pdf"):
                    index_md_content += f"  - pdf: {filename}\n"
                else:
                    index_md_content += f"  - file: {filename}\n"

            index_md_content += "---\n"

            index_md_filename = os.path.join(output_folder, category_path, "index.md")

            os.makedirs(os.path.dirname(index_md_filename), exist_ok=True)

            with open(index_md_filename, "w") as index_md_file:
                index_md_file.write(index_md_content)


if __name__ == "__main__":
    dir = {
        "./btech": "./_btech",
        "./bca": "./_bca",
    }
    for root_folder, output_folder in dir.items():
        generate_md_files(root_folder, output_folder)

    print("Markdown files generated successfully.")
