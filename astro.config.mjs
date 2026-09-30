import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders, svgoOptimizer } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
	site: "https://haldwani.gehu.in",
	base: "/pyqs/",
	trailingSlash: "always",
	// ClientRouter prefetches every link, and clientPrerender turns each prefetch into a full prerender.
	// "hover" keeps heavy PDF pages from loading until a link is hovered, and folder links opt into "viewport".
	prefetch: {
		defaultStrategy: "hover",
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Noto Sans",
			cssVariable: "--font-noto-sans",
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
	integrations: [sitemap(), icon(), mdx()],
	vite: {
		cacheDir: "./cache/vite",
		plugins: [tailwindcss()],
	},
});
