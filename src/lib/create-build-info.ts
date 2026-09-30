import type { Social } from "@/configs/types";
import type { BuildInfo } from "./build-info";
import { renderIconSvg } from "./icons";

// Build-time only: pulls in full icon sets.
function createBuildInfo(
	socials: Social[],
	builtAt: Date = new Date(),
): BuildInfo {
	return {
		builtAt: builtAt.toISOString(),
		socials: socials.flatMap((social) => {
			const svg = renderIconSvg(social.iconify);
			return svg ? [{ ...social, svg }] : [];
		}),
	};
}

export { createBuildInfo };
