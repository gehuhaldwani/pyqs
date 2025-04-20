import { trailingSlash, base } from "astro:config/client";

// This method adds a forward slash to paths, and prepends the `base`
function addForwardSlashAndBase(path: string) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	// remove trailing slash from base to prevent double slashes
	const basePath = base.endsWith("/") ? base.slice(0, -1) : base;
	let url = `${basePath}${normalizedPath}`;

	if (trailingSlash === "always" && !url.endsWith("/")) {
		url += "/";
	} else if (trailingSlash === "never" && url.endsWith("/")) {
		url = url.slice(0, -1);
	}

	return url;
}

export { addForwardSlashAndBase };
