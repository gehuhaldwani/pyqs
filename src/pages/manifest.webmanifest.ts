import { base } from "astro:config/server";
import type { APIRoute } from "astro";
import siteConfig from "@/configs/site.config";
import { createManifest } from "@/lib/pwa";

export const GET: APIRoute = () => {
	const manifest = createManifest({
		base,
		name: `GEHU ${siteConfig.site.title}`,
		shortName: siteConfig.site.title,
		description: siteConfig.site.description,
	});
	return new Response(JSON.stringify(manifest), {
		headers: { "Content-Type": "application/manifest+json" },
	});
};
