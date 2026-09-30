import { defineConfig, fontProviders, svgoOptimizer} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";

export default defineConfig({
	site: "https://haldwani.gehu.in",
	base: "/pyqs/",
	trailingSlash: "always",
	// ClientRouter enables prefetchAll, and clientPrerender turns each prefetch
	// into a full prerender. Default to "hover" so heavy pages (PDF viewer) only
	// load on intent; folder links opt into "viewport" via data-astro-prefetch.
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
			name: "Noto Serif",
			cssVariable: "--font-noto-serif",
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
		options:{
			variants:[{
				src: ["./src/assets/fonts/excalifont.woff2"],
				weight: "normal",
				style: "normal",
			}]
		}
	}],
	cacheDir: "./cache/astro",
	compressHTML:true,
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
