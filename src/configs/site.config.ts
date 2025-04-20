import siteConfig from "./settings.json" with { type: "json" };

interface NavigationEntry {
	name: string;
	url: string;
}

interface SiteConfig {
	title: string;
	description: string;
	site: string;
	favicon: string;
	logo: string;
	navigation: NavigationEntry[];
}

export default siteConfig as SiteConfig;

type Social = {
	id: string;
	name: string;
	url: string;
	iconify: string;
};

const response = await fetch(
	"https://raw.githubusercontent.com/mglsj/socials/refs/heads/main/socials.json",
).then((res) => res.json());

export const SOCIALS: Social[] = response.primary as Social[];
