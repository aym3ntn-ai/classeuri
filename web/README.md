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
