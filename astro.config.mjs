import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";
import playformCompress from "@playform/compress";

export default defineConfig({
	site: "https://haldwani.gehu.in",
	base: "/pyqs/",
	trailingSlash: "always",
	prefetch: {
		defaultStrategy: "viewport",
	},
	integrations: [sitemap(), icon(), mdx(), playformCompress({ Image: false })],
	vite: {
		plugins: [tailwindcss()],
	},
});
