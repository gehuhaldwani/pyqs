import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders, svgoOptimizer } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
	site: "https://haldwani.gehu.in",
	base: "/pyqs/",
	trailingSlash: "always",
	prefetch: {
		defaultStrategy: "hover",
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Figtree",
			cssVariable: "--font-figtree",
			weights: [400, 500, 600, 700, 800],
		},
		{
			provider: fontProviders.google(),
			name: "Noto Sans Mono",
			cssVariable: "--font-noto-sans-mono",
		},
		{
			provider: fontProviders.local(),
			name: "Excalifont",
			cssVariable: "--font-excalifont",
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/excalifont.woff2"],
						weight: "normal",
						style: "normal",
					},
				],
			},
		},
	],
	cacheDir: "./cache/astro",
	compressHTML: true,
	experimental: {
		clientPrerender: true,
		svgOptimizer: svgoOptimizer(),
		incrementalBuild: true,
	},
	integrations: [
		sitemap({ filter: (page) => !page.endsWith("/offline/") }),
		icon(),
		mdx(),
		svelte(),
	],
	vite: {
		cacheDir: "./cache/vite",
		plugins: [tailwindcss()],
	},
});
