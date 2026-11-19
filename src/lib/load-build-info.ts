import { BUILD_INFO_PATH, type BuildInfo } from "@/lib/build-info";
import { addBaseUrl } from "@/utils/site-url";

let buildInfo: Promise<BuildInfo | null> | undefined;

// The client router keeps this module loaded between pages, so the file is fetched once per visit.
function loadBuildInfo(): Promise<BuildInfo | null> {
	buildInfo ??= fetch(addBaseUrl(BUILD_INFO_PATH), { cache: "no-cache" })
		.then((res) => (res.ok ? (res.json() as Promise<BuildInfo>) : null))
		.catch(() => null);
	return buildInfo;
}

export { loadBuildInfo };
