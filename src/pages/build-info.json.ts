import type { APIRoute } from "astro";
import { SOCIALS } from "@/configs/site.config";
import { createBuildInfo } from "@/lib/create-build-info";

// No getStaticPaths()/cacheKey, so this is regenerated on every build.
export const GET: APIRoute = () => {
	return new Response(JSON.stringify(createBuildInfo(SOCIALS)), {
		headers: { "Content-Type": "application/json" },
	});
};
