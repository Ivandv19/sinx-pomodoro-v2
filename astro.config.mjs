import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

import react from "@astrojs/react";

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    runtime: {
      mode: 'on',
    },
  }),
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