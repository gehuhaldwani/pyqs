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
		contentBranch: string;
		thumbnailsBranch: string;
		logo: string;
		// Default 1200x630 share image, made by `bun run og`.
		ogImage: string;
		favicon: string;
		timezone: string;
	};
	header: {
		links: NavigationEntry[];
	};
	footer: {
		maintainer: {
			name: string;
			designation: string;
			support: string;
		};
		links: NavigationEntry[];
	};
}

type Social = {
	id: string;
	name: string;
	url: string;
	iconify: string;
};

export type { NavigationEntry, SiteConfig, Social };
