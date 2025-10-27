import siteConfig from "../../site.config.json" with { type: "json" };

interface NavigationEntry {
	type: "internal" | "external";
	name: string;
	url: string;
}

interface SiteConfig {
	site: {
		title: string;
		description: string;
		url: string;
		githubRepo: string;
		logo: string;
		favicon: string;
		timezone: string;
	},
	header: {
		links: NavigationEntry[];
	}
	footer: {
		maintainer: {
			title: string;
			subtitle: string;
		},
		links: NavigationEntry[];
	}
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
