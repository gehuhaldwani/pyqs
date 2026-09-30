// The pure helpers in `url.ts`, bound to this site's `base` and `trailingSlash`.
import { base, trailingSlash } from "astro:config/client";
import { applyTrailingSlash, EXTERNAL_LINK_ATTRIBUTES, joinBase } from "./url";

// Prepends `base`, e.g. for assets: "/logo.png" -> "/pyqs/logo.png"
function addBaseUrl(path: string): string {
	return joinBase(base, path);
}

// Prepends `base` and applies the trailing slash rule, for page links.
function addForwardSlashAndBaseUrl(path: string): string {
	return applyTrailingSlash(addBaseUrl(path), trailingSlash);
}

// `href` (and target/rel) for a link: external URLs open in a new tab,
// internal paths are resolved against the site's base.
function linkAttributes(href: string, external = false) {
	return external
		? { href, ...EXTERNAL_LINK_ATTRIBUTES }
		: { href: addForwardSlashAndBaseUrl(href) };
}

export { addBaseUrl, addForwardSlashAndBaseUrl, linkAttributes };
