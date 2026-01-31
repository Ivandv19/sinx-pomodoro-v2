import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

import preact from "@astrojs/preact";

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  site: 'https://sinx-pomodoro.mgdc.site',
  prefetch: true,
  integrations: [preact(), sitemap()], 
  
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['@node-rs/argon2', '@node-rs/bcrypt']
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