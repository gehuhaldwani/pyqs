import type { APIRoute } from "astro";
import { sitemapIndexUrl } from "@/utils/url";

const getRobotsTxt = (sitemapURL: URL) => `\
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

// Crawlers only read /robots.txt at the domain root, so this copy under the base path has no effect unless the root serves it.
export const GET: APIRoute = ({ site }) => {
	const sitemapURL = sitemapIndexUrl(
		site ?? import.meta.env.SITE,
		import.meta.env.BASE_URL,
	);
	return new Response(getRobotsTxt(sitemapURL));
};
