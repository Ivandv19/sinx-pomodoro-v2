import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

import preact from "@astrojs/preact";

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  site: 'https://sinx-pomodoro.pages.dev',
  integrations: [preact(), sitemap()], 
  
  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
        prefixDefaultLocale: false 
    }
  },
})