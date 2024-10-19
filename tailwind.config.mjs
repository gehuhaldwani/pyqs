/** @type {import('tailwindcss').Config} */

import typographyPlugin from "@tailwindcss/typography";

export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	darkMode: "class",
	theme: {
		extend: {},
	},
	plugins: [typographyPlugin],
};
