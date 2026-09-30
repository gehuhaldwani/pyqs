import type { APIRoute } from "astro";
import { sitemapIndexUrl } from "@/utils/url";

const getRobotsTxt = (sitemapURL: URL) => `\
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

// Note: crawlers only read /robots.txt at the domain root, so this file (served
// under the `base` path) is informational unless the root serves or proxies it.
export const GET: APIRoute = ({ site }) => {
	const sitemapURL = sitemapIndexUrl(
		site ?? import.meta.env.SITE,
		import.meta.env.BASE_URL,
	);
	return new Response(getRobotsTxt(sitemapURL));
};
