import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import brand from './src/config/brand.json' with { type: 'json' };

export default defineConfig({
  site: brand.site,
  output: 'static',
  trailingSlash: 'always',
  server: { host: false },
  integrations: [react(), mdx()],
});
