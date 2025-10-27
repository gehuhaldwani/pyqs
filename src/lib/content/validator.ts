import type { FsEntry } from "./schema";

// Validators for directories and files

type Validator<T extends "dir" | "file"> = (entry: FsEntry<T>) => boolean;

type Validators = {
    directory?: Validator<"dir">;
    file?: Record<string, Validator<"file">>;
}

function validateDirectory(
    entry: FsEntry<"dir">,
    validators?: Validators,
): boolean {
    if (validators?.directory) {
        return validators.directory(entry);
    }
    return true;
}

function validateFile(
    entry: FsEntry<"file">,
    validators?: Validators,
): boolean {
    const extension = entry.extension || "";
    const fileValidator = validators?.file?.[extension] || validators?.file?.["*"] || null;
    if (fileValidator) {
        return fileValidator(entry);
    }
    return true;
}

export type { Validator, Validators };
export { validateDirectory, validateFile };