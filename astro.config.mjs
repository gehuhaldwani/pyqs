import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";

export default defineConfig({
	site: "https://haldwani.gehu.in",
	base: "/pyqs/",
	trailingSlash: "always",
	prefetch: {
		defaultStrategy: "viewport",
	},
	cacheDir: "./cache/astro",
	compressHTML:true,
	experimental: {
		svgo: true,
	},
	integrations: [sitemap(), icon(), mdx()],
	vite: {
		cacheDir: "./cache/vite",
		plugins: [tailwindcss()],
	},
});
