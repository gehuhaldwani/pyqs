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
			name: string;
			designation: string;
			support: string;
		},
		links: NavigationEntry[];
	}
}

type Social = {
	id: string;
	name: string;
	url: string;
	iconify: string;
};


export type { SiteConfig, NavigationEntry, Social };