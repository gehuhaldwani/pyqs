import type { Social } from "@/configs/types";

// The Footer's client script imports this module, so keep build-only imports such as icon sets out of it.

// Every build regenerates /build-info.json, so it has the latest data even when a page's HTML is reused.
type BuildInfo = {
	builtAt: string;
	socials: (Social & { svg: string })[];
};

const BUILD_INFO_PATH = "/build-info.json";

export type { BuildInfo };
export { BUILD_INFO_PATH };
