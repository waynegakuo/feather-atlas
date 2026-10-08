# Feather Atlas

Interactive 3D bird field guide built with Angular 22.2 and Three.js (CDN import map).

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`. Featured species **Hoopoe** and **Kingfisher** load images and GLB specimens from CloudFront URLs in `src/app/data/asset-urls.ts` (not bundled in the repo).

**Live demo:** [https://feather-atlas.web.app](https://feather-atlas.web.app)

### Deploy (Firebase Hosting)

```bash
npm run deploy
```

Project: `feather-atlas` (`.firebaserc`). Serves `dist/feather-atlas/browser` with SPA rewrites.

**Demo scope:** two interactive GLB specimens. Sidebar **Home** resets the stage; **Featured** focuses the viewer; **Explorer guide**, **Focus view**, and **Scene lighting** are working actions (no placeholder collections). On viewports without the sidebar, use the hand icon in the top bar to open the guide.

## Design system

- Tokens: `src/styles/_tokens.scss`
- Reusable UI: `src/app/design-system/`
