import { defineConfig } from 'astro/config';

// Served from https://aym3ntn-ai.github.io/classeuri/ (GitHub Pages project site).
export default defineConfig({
  site: 'https://aym3ntn-ai.github.io',
  base: '/classeuri/',
  trailingSlash: 'always',
  output: 'static',
});
