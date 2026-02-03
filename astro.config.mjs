import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from "@astrojs/react";

export default defineConfig({
  output: 'static',
  site: 'https://sinx-pomodoro.mgdc.site',
  prefetch: true,
  integrations: [react(), sitemap()], 
  
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: []
    },
    server: {
      watch: {
        ignored: ['**/.wrangler/**']
      }
    }
  },

  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: {
        prefixDefaultLocale: false 
    }
  },
})