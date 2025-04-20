import { trailingSlash, base } from "astro:config/client";

function addBaseUrl(path: string) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	// remove trailing slash from base to prevent double slashes
	const basePath = base.endsWith("/") ? base.slice(0, -1) : base;
	return `${basePath}${normalizedPath}`;
}

// This method adds a forward slash to paths, and prepends the `base`
function addForwardSlashAndBaseUrl(path: string) {
	let url = addBaseUrl(path);

	if (trailingSlash === "always" && !url.endsWith("/")) {
		url += "/";
	} else if (trailingSlash === "never" && url.endsWith("/")) {
		url = url.slice(0, -1);
	}

	return url;
}

export { addForwardSlashAndBaseUrl, addBaseUrl };
