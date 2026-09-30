import type { APIRoute } from "astro";
import { SOCIALS } from "@/configs/site.config";
import { createBuildInfo } from "@/lib/create-build-info";

// This route has no cacheKey, so every build regenerates it.
export const GET: APIRoute = () => {
	return new Response(JSON.stringify(createBuildInfo(SOCIALS)), {
		headers: { "Content-Type": "application/json" },
	});
};
