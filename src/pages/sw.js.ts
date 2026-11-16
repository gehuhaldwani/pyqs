import { base } from "astro:config/server";
import type { APIRoute } from "astro";
import siteConfig from "@/configs/site.config";
import source from "@/lib/service-worker.js?raw";

// This route has no cacheKey, so every build regenerates it. The new VERSION makes browsers install the new worker.
export const GET: APIRoute = () => {
	const { githubRepo, contentBranch } = siteConfig.site;
	const constants = {
		VERSION: new Date().toISOString(),
		BASE: base,
		PAPERS_ORIGIN: new URL(
			`https://raw.githubusercontent.com/${githubRepo}/${contentBranch}/`,
		).origin,
	};
	const header = Object.entries(constants)
		.map(([name, value]) => `const ${name} = ${JSON.stringify(value)};`)
		.join("\n");

	return new Response(`${header}\n\n${source}`, {
		headers: { "Content-Type": "text/javascript" },
	});
};
