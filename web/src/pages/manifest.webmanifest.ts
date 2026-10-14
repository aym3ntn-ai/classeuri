// Web app manifest: lets iOS and Android install the site as an app.

import type { APIRoute } from 'astro';
import { href } from '../lib/catalog';
import { lang, t } from '../lib/i18n';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        id: href(),
        name: t.app.name,
        short_name: t.app.name,
        description: t.app.tagline,
        lang,
        start_url: href(),
        scope: href(),
        display: 'standalone',
        orientation: 'any',
        background_color: '#F2F3F5',
        theme_color: '#11151C',
        icons: [
          { src: href('icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: href('icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: href('icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
