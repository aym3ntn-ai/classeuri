# Classeuri — Android app

Expo SDK 57 + Expo Router + TypeScript. Reads `catalog.json` and the PDFs from
GitHub Pages; everything downloaded stays readable offline.

```
src/app/                  routes: (tabs)/(courses), (tabs)/downloads, (tabs)/settings, viewer
src/components/           tiles, rows, badges, tab bar, PDF view
src/store/                persisted state: settings, catalog, downloads, reading position
src/lib/                  catalog diff, file storage, helpers
src/theme/                design tokens (light and dark)
```

UI strings live in `shared/src/fr.ts`. Run every command below from the repo root.

## Check

```bash
npm run typecheck --workspace app
```

```bash
npm run lint --workspace app
```

```bash
npm test --workspace app
```

## Run

The app uses native modules (PDF renderer), so it does not run in Expo Go.

**On an Android phone or emulator** (needs Android Studio and JDK 17):

```bash
npm run android --workspace app
```

**Against local content** instead of GitHub Pages, start the content server with
your computer's LAN address, then point the app at it:

```bash
npm run serve:content -- --host 192.168.1.20
```

```bash
EXPO_PUBLIC_SOURCE_URL=http://192.168.1.20:8787/ npm run android --workspace app
```

**In a browser**, for layout work only. Downloads are simulated and the PDF opens
in the browser's own viewer:

```bash
npm run serve:content
```

```bash
EXPO_PUBLIC_SOURCE_URL=http://localhost:8787/ npm run web --workspace app
```

## Release

Bump `"version"` in `app/package.json` and push to `main`. The `Android APK`
workflow builds, signs and publishes `classeuri-X.Y.Z.apk` as a GitHub Release.
Signing setup: [docs/ANDROID_SIGNING.md](../docs/ANDROID_SIGNING.md).

Pull requests that touch `app/` build a test APK, attached to the workflow run.
