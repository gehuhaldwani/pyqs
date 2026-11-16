#!/usr/bin/env bash
# Makes the thumbnails folder match the PDFs in this repository: renders new or changed PDFs and deletes thumbnails whose PDF is gone.
# Run it from the repository root. It compares state instead of diffs, so a failed or cancelled run is fixed by the next one.
#
# Environment:
#   OUT      thumbnails folder (a checkout of the thumbnails branch)
#   REBUILD  "true" renders every PDF again
#   SIZE     longest side of a thumbnail in pixels (default 512)
#   JOBS     parallel renders (default: number of CPUs)
#
# Writes failed=<count> to $GITHUB_OUTPUT when it is set.

set -euo pipefail

: "${OUT:?OUT must point to the thumbnails folder}"
OUT="${OUT%/}"
REBUILD="${REBUILD:-false}"
SIZE="${SIZE:-512}"
JOBS="${JOBS:-$(nproc)}"

MANIFEST="$OUT/.manifest.tsv"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
FAILED_LIST="$WORK/failed.txt"
: >"$FAILED_LIST"
export OUT SIZE FAILED_LIST

mkdir -p "$OUT"
touch "$MANIFEST"

# PDFs tracked in git, as "blob<TAB>path". The blob id changes whenever the file's content changes.
git -c core.quotePath=false ls-files -s -z -- ':(icase)*.pdf' |
	while IFS= read -r -d '' entry; do
		meta="${entry%%$'\t'*}"
		blob="${meta#* }"
		printf '%s\t%s\n' "${blob%% *}" "${entry#*$'\t'}"
	done | LC_ALL=C sort >"$WORK/current.tsv"

declare -A rendered_blob
while IFS=$'\t' read -r blob path; do
	rendered_blob["$path"]="$blob"
done <"$MANIFEST"

# Render a PDF when forced, when its content changed since the last render, or when its thumbnail is missing.
declare -A expected
: >"$WORK/render.list"
while IFS=$'\t' read -r blob path; do
	thumb="$OUT/${path%.*}.webp"
	expected["$thumb"]=1
	if [[ "$REBUILD" == "true" || "${rendered_blob[$path]-}" != "$blob" || ! -f "$thumb" ]]; then
		printf '%s\0' "$path" >>"$WORK/render.list"
	fi
done <"$WORK/current.tsv"

to_render=$(tr -cd '\0' <"$WORK/render.list" | wc -c)
echo "PDFs: $(wc -l <"$WORK/current.tsv"), to render: $to_render"

# In a sparse, blobless checkout (as in CI), add only the PDFs to render, so git downloads just those files.
if [[ "$(git config --type=bool core.sparseCheckout || echo false)" == "true" && "$to_render" -gt 0 ]]; then
	{
		printf '/.github/\n'
		tr '\0' '\n' <"$WORK/render.list" | sed -e 's/[][*?\\]/\\&/g' -e 's|^|/|'
	} | git sparse-checkout set --no-cone --stdin
fi

render() {
	local pdf="$1" thumb tmp
	thumb="$OUT/${pdf%.*}.webp"
	tmp="$(mktemp -d)"
	if pdftoppm -f 1 -l 1 -singlefile -scale-to "$SIZE" -png "$pdf" "$tmp/page" &&
		mkdir -p "$(dirname "$thumb")" &&
		cwebp -quiet -q 80 "$tmp/page.png" -o "$thumb"; then
		echo "Rendered: $pdf"
	else
		echo "::warning file=$pdf::Could not render a thumbnail for $pdf"
		printf '%s\n' "$pdf" >>"$FAILED_LIST"
	fi
	rm -rf "$tmp"
}
export -f render

if [[ "$to_render" -gt 0 ]]; then
	xargs -0 -r -n 1 -P "$JOBS" bash -c 'render "$1"' _ <"$WORK/render.list"
fi

removed=0
while IFS= read -r -d '' thumb; do
	if [[ -z "${expected[$thumb]-}" ]]; then
		rm -- "$thumb"
		echo "Removed: ${thumb#"$OUT"/}"
		removed=$((removed + 1))
	fi
done < <(find "$OUT" -path "$OUT/.git" -prune -o -type f -iname '*.webp' -print0)
echo "Removed $removed thumbnails without a PDF"

# Record what is rendered now. Failed PDFs stay out, so the next run tries them again.
declare -A failed
while IFS= read -r path; do
	if [[ -n "$path" ]]; then
		failed["$path"]=1
	fi
done <"$FAILED_LIST"
while IFS=$'\t' read -r blob path; do
	if [[ -z "${failed[$path]-}" ]]; then
		printf '%s\t%s\n' "$blob" "$path"
	fi
done <"$WORK/current.tsv" >"$MANIFEST"

failed_count=$(grep -c . "$FAILED_LIST" || true)
echo "Failed: $failed_count"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
	echo "failed=$failed_count" >>"$GITHUB_OUTPUT"
fi
