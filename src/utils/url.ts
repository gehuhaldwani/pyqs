// Pure URL helpers. Keep this module free of `astro:*` imports so it can be
// unit tested; `site-url.ts` binds these to the site's Astro config.

type TrailingSlash = "always" | "never" | "ignore";

const UPLOADER_URL = "https://pyqs-uploader.pages.dev/";

// Attributes for links that leave the site.
const EXTERNAL_LINK_ATTRIBUTES = { target: "_blank", rel: "noopener" } as const;

function ensureLeadingSlash(path: string): string {
	return path.startsWith("/") ? path : `/${path}`;
}

// joinBase("/pyqs/", "about") -> "/pyqs/about"
function joinBase(base: string, path: string): string {
	const basePath = base.endsWith("/") ? base.slice(0, -1) : base;
	return `${basePath}${ensureLeadingSlash(path)}`;
}

// Adds or removes the trailing slash to match Astro's `trailingSlash` option.
function applyTrailingSlash(url: string, trailingSlash: TrailingSlash): string {
	if (trailingSlash === "always" && !url.endsWith("/")) {
		return `${url}/`;
	}
	if (trailingSlash === "never" && url.endsWith("/") && url !== "/") {
		return url.slice(0, -1);
	}
	return url;
}

// Encodes each segment of a slash-separated path while keeping the slashes.
function encodePath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

function githubRawUrl(repo: string, branch: string, path: string): string {
	return `https://raw.githubusercontent.com/${repo}/${branch}${encodePath(ensureLeadingSlash(path))}`;
}

function pdfThumbnailPath(path: string): string {
	return path.replace(/\.pdf$/i, ".webp");
}

function uploaderUrl(path: string, title: string): string {
	return `${UPLOADER_URL}?path=${encodeURIComponent(path)}&title=${encodeURIComponent(title)}`;
}

function sitemapIndexUrl(site: URL | string, base: string): URL {
	return new URL(joinBase(base, "sitemap-index.xml"), site);
}

export type { TrailingSlash };
export {
	applyTrailingSlash,
	EXTERNAL_LINK_ATTRIBUTES,
	encodePath,
	githubRawUrl,
	joinBase,
	pdfThumbnailPath,
	sitemapIndexUrl,
	uploaderUrl,
};
