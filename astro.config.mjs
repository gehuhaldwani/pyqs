import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";

export default defineConfig({
	site: "https://gehuhaldwani.in",
	base: "/pyqs/",
	trailingSlash: "always",
	prefetch: {
		defaultStrategy: "viewport",
	},
	integrations: [sitemap(), icon(), mdx()],
	vite: {
		plugins: [tailwindcss()],
	},
});
