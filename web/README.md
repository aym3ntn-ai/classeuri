# Classeuri — web app

Astro (static output) + TypeScript, served from
https://aym3ntn-ai.github.io/classeuri/. Every page is generated at build time
from `catalog.json`; the PDF viewer uses PDF.js.

```
src/pages/index.astro                                   Accueil: semester switcher, course tiles
src/pages/cours/[year]/[semester]/[course]/index.astro  course page: sections and their PDFs
src/pages/cours/…/[section]/[doc].astro                 in-page PDF viewer
src/scripts/viewer.ts                                   viewer logic (lazy pages, zoom, go to page)
src/lib/                                                catalog access, links, i18n
```

UI strings live in `shared/src/fr.ts`. Run every command below from the repo root.

## Installable app (PWA)

The site installs to the home screen on iOS (Safari → Share → Add to Home
Screen) and Android. `src/pages/manifest.webmanifest.ts` generates the manifest;
the Apple meta tags are in `src/layouts/Base.astro`; `public/sw.js` is the
service worker (hashed assets cache-first; pages, `catalog.json` and PDFs
network-first, so a document opened once stays readable offline; at most 80
PDFs are kept). `src/pages/installer/` is the install page linked from the
footer and from a dismissible banner shown to iPhone visitors.

## Run

Generate `catalog.json` and copy the PDFs into `web/public/` (repeat after adding PDFs):

```bash
npm run content --workspace web
```

```bash
npm run dev --workspace web
```

Then open http://localhost:4321/classeuri/.

## Check and build

```bash
npm run check --workspace web
```

```bash
npm run build --workspace web
```

```bash
npm run preview --workspace web
```

## Deploy

Push to `main`. The `Deploy site` workflow tests the generator, rebuilds
`catalog.json`, builds the site and publishes it with the PDFs to GitHub Pages.
Pages must be set to "GitHub Actions" as its source (repo → Settings → Pages).
