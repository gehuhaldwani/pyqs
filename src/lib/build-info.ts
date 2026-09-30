import type { Social } from "@/configs/types";

// Client-safe: imported by the Footer script. Keep build-time-only imports
// (icon sets, site config) out of this module.

// Served at /build-info.json. That route is not cached by incremental builds,
// so it always reflects the latest build even when a page's HTML was reused.
type BuildInfo = {
	builtAt: string;
	socials: (Social & { svg: string })[];
};

const BUILD_INFO_PATH = "/build-info.json";

export { BUILD_INFO_PATH };
export type { BuildInfo };
