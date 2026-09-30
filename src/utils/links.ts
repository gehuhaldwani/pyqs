// Pure URL builders. Keep this module free of `astro:*` imports so it can be unit tested.

const UPLOADER_URL = "https://pyqs-uploader.pages.dev/";

// Encodes each segment of a slash-separated path while keeping the slashes.
function encodePath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

function githubRawUrl(repo: string, branch: string, path: string): string {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `https://raw.githubusercontent.com/${repo}/${branch}${encodePath(normalizedPath)}`;
}

function pdfThumbnailPath(path: string): string {
	return path.replace(/\.pdf$/i, ".webp");
}

function uploaderUrl(path: string, title: string): string {
	return `${UPLOADER_URL}?path=${encodeURIComponent(path)}&title=${encodeURIComponent(title)}`;
}

function sitemapIndexUrl(site: URL | string, base: string): URL {
	const baseDir = base.endsWith("/") ? base : `${base}/`;
	return new URL(`${baseDir}sitemap-index.xml`, site);
}

export { encodePath, githubRawUrl, pdfThumbnailPath, uploaderUrl, sitemapIndexUrl };
