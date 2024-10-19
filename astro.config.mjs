import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'

// https://astro.build/config
export default defineConfig({
    site: "https://gehuhaldwani.in",
    base: '/pyqs',
    integrations: [ sitemap(), tailwind()],
})
