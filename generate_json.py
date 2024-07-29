import os
import shutil
import configparser
import json

ROOT_FOLDER = "pyqs"


def generate_json_files(root_folder, output_folder):
    config = configparser.ConfigParser()
    for foldername, subfolders, filenames in os.walk(root_folder):

        # ignore hidden folders
        subfolders[:] = [s for s in subfolders if not s.startswith(".")]
        # ignore hidden files and files without extension
        filenames = [f for f in filenames if f.find(".") > 0]

        if filenames or subfolders:
            category_path = os.path.relpath(foldername, root_folder)
            # pdfs
            for filename in filenames:
                if filename.endswith(".pdf"):
                    pdf_title = os.path.splitext(filename)[0]

                    json_content = {
                        "title": pdf_title,
                        "type": "pdf",
                        "path": f"/{foldername.replace('\\','/')}/{filename}",
                        "parent_path": (
                            f"/{foldername.replace('\\','/')}/" if foldername else None
                        ),
                    }
                    json_filename = os.path.join(
                        output_folder,
                        category_path,
                        f"{pdf_title}.json",
                    )
                    os.makedirs(os.path.dirname(json_filename), exist_ok=True)
                    with open(json_filename, "w") as json_file:
                        json.dump(json_content, json_file, indent=4)

            # directory folder
            index_json_content = {
                "title": os.path.basename(foldername),
                "type": "dir",
                "path": f"/{foldername.replace('\\','/')}/",
                "parent_path": (
                    f"/{os.path.dirname(foldername).replace('\\','/')}/"
                    if os.path.dirname(foldername)
                    else None
                ),
                "entries": [],
            }
            for subfolder in sorted(subfolders):
                index_json_content["entries"].append(
                    {
                        "type": "dir",
                        "title": subfolder,
                        "path": f"/{foldername.replace('\\','/')}/{subfolder.replace('\\','/')}/",
                    }
                )
            for filename in sorted(filenames):
                if filename.endswith(".pdf"):
                    index_json_content["entries"].append(
                        {
                            "type": "pdf",
                            "title": filename,
                            "path": f"/{foldername.replace('\\','/')}/{filename.replace('.pdf','')}",
                        }
                    )
                elif filename.endswith(".url"):
                    config.read(os.path.join(foldername, filename))
                    url = config["InternetShortcut"]["URL"]
                    index_json_content["entries"].append(
                        {
                            "type": "url",
                            "title": filename,
                            "path": url,
                        }
                    )
                else:
                    index_json_content["entries"].append(
                        {
                            "type": "file",
                            "title": filename,
                            "path": f"/{foldername.replace('\\','/')}/{filename.replace('\\','/')}",
                        }
                    )
            index_json_filename = os.path.join(
                output_folder,
                category_path,
                "index.json",
            )
            os.makedirs(os.path.dirname(index_json_filename), exist_ok=True)
            with open(index_json_filename, "w") as index_json_file:
                json.dump(index_json_content, index_json_file, indent=4)


if __name__ == "__main__":
    folder = ROOT_FOLDER
    output_folder = "src/content/" + folder
    # remove output folder if exists
    if os.path.exists(output_folder):
        shutil.rmtree(output_folder)
    generate_json_files(folder, output_folder)

    print("JSON files generated successfully.")
