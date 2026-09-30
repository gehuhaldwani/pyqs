// The url.ts helpers, bound to this site's base and trailingSlash settings.
import { base, trailingSlash } from "astro:config/client";
import { applyTrailingSlash, EXTERNAL_LINK_ATTRIBUTES, joinBase } from "./url";

// For assets. "/logo.png" becomes "/pyqs/logo.png".
function addBaseUrl(path: string): string {
	return joinBase(base, path);
}

// For page links. Adds the base and the trailing slash.
function addForwardSlashAndBaseUrl(path: string): string {
	return applyTrailingSlash(addBaseUrl(path), trailingSlash);
}

// External links open in a new tab. Internal paths get the site's base.
function linkAttributes(href: string, external = false) {
	return external
		? { href, ...EXTERNAL_LINK_ATTRIBUTES }
		: { href: addForwardSlashAndBaseUrl(href) };
}

export { addBaseUrl, addForwardSlashAndBaseUrl, linkAttributes };
