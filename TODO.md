# Zenkai outcomes

## Preserve and run the supplied application
- [x] Import the supplied public `main` snapshot at `9584bfc67afae6a3969f4c1ed15b87f9705a2e57` into this Manus project without copying its `.git` directory or replacing the Manus canonical remote. Preserve the current React/Vite/TypeScript application, original assets, API handlers, Cloudflare Pages function wrappers, README and MIT license.
- [x] Preserve the supplied source design: responsive phone, tablet and desktop layouts; polished light and dark themes; the crimson Anime identity, monochrome Movies identity, indigo Manga identity and amber Novels identity; Inter body text and Outfit display typography; original Zenkai logo and reduced-motion behavior. Do not add unspecified product features or replace the source visual language.

## Anime discovery, titles and player
- [x] Preserve Anime trending, popular and top-rated rows; the airing schedule in local time; sub and dub; multiple servers; intro/outro skip; captions; and optional Anime4K upscaling.
- [x] Preserve Anime catalog routes `/home`, `/trending`, `/popular`, `/top`, `/browse` and `/schedule`; title detail routes `/anime/:id` and `/mal/:id`; and player route `/watch/:id`, including the source's query parameters for episode, server and audio.
- [x] Preserve details pages with AniList and MAL score rings, next-episode countdown, characters and voice actors, staff, related titles, watch order, score distribution and recommendations.

## Movies, manga and novels
- [x] Preserve Movies and TV via TMDB: browse and search, details and a full-screen player. Keep `/movies`, `/movies/browse`, `/movies/:type/:id` and `/movies/watch/:type/:id`.
- [x] Preserve the Manga section and its five sources/servers (ComicK, Manhua, Asura Scans, WeebCentral and MangaDex), browse/search, details, reader and saved reader preferences. Keep `/manga`, `/manga/browse`, `/manga/find`, `/manga/:id` and `/manga/:id/read/:chapterId`.
- [x] Preserve Novels search, details, chapters and a distraction-free reader. Keep `/novel`, `/novel/find`, `/novel/:source/:slug` and `/novel/:source/:slug/read/:chapter`.

## Shared interaction and personalization
- [x] Preserve Continue watching / reading shelves, watchlist and progress stored locally in the browser; AniList sync and a customisable profile; and the `/list`, `/profile`, `/auth/anilist` and `/community` surfaces.
- [x] Preserve command-palette search (`Ctrl/⌘ + K` or `/`) with keyboard navigation and filters; the theme toggle with circular reveal animation; phone bottom dock and desktop floating glass navbar; and keyboard/TV-remote behavior.
- [x] Preserve multi-audio dubs through the ACDN resolver in Zenkai's player, and preserve Zenkai Shield as an optional invisible proof-of-work gate for the API.
- [x] Preserve the opening section chooser at `/`, app/release page at `/app`, and the source's remaining `/busted` and not-found handling.

## Manus development integration
- [x] Keep the original Vite `zenkaiApi` development middleware calling `server/handler.js` for `/api/*` and `/proxy` in Preview; do not rewrite the upstream provider or Cloudflare Pages function behavior.
- [x] Add `public/manus-routes.json` containing the complete non-404 route set from `src/App.tsx`, including dynamic route patterns; verify the running site serves valid JSON at `/manus-routes.json` with HTTP 200.
- [x] Pin the package manager and record lifecycle-script policy before the first install; install from the committed lockfile; register TypeScript post-edit diagnostics before application-code edits; and complete the repository build with `pnpm run build` (the source's `build` script type-checks and then runs Vite).
- [x] Configure and start the Manus Preview service on the project's initialized runtime port only after the source and route manifest are ready; verify the application responds over HTTP.
- [x] Configure the static build contract as `corepack pnpm install --frozen-lockfile && corepack pnpm run build` with output directory `dist`; the pinned command succeeds locally and `dist/index.html` exists.

## Live playback API and hybrid deployment
- [ ] On `https://zenkai-lhw34qff.manus.space/watch/212888`, the page displayed “Media Playback Locked” and `GET https://zenkai-lhw34qff.manus.space/api/shield/challenge` returned HTTP 500. Provide a working production server path for `/api/*` and `/proxy` by adapting the existing shared `server/handler.js`, not by replacing provider behavior.
- [x] Add a Node HTTP bridge that converts incoming requests to Web `Request` objects, calls the shared handler with server environment values, and streams Web `Response` bodies back to clients so media/proxy bodies are not buffered as whole files. Add unauthenticated `GET /healthz` returning a 2xx response, bind `0.0.0.0`, honor `PORT`, and default to port `3000`.
- [x] Make the shared anime mapping module importable in Node and Vite/Cloudflare by using JSON import attributes supported by Node; retain the original Cloudflare Pages function wrappers.
- [x] Match `.env.example`'s optional Shield contract: do not use a hard-coded `SHIELD_SECRET`; with the secret unset, rate limiting remains active, `/api/shield/challenge` returns `{ "off": true }`, and API/proxy requests are not blocked for lacking a token. If `SHIELD_SECRET` is later configured securely, keep the existing challenge, proof-of-work and HMAC verification path.
- [x] Add a Node 22 `Dockerfile` that uses the pinned `pnpm@11.25.0`, committed lockfile and reviewed lifecycle policy for a build, then runs the production Node API entrypoint. Include the API source, ESM package metadata and required anime mapping in the runtime image; do not copy development credentials or build-time private values into the image.
- [x] Enable Manus `features.server` only; keep the managed database disabled. Configure the container declaration for `Dockerfile` with health path `/healthz`. Keep static `build.command` and `build.outputDirectory` as specified above.
- [x] Configure `/api/*`, `/proxy` and `/healthz` to the server, then use `/*` as the static SPA fallback route. Keep the existing page route manifest independent of these published request routes.
- [x] Preserve Preview HTTP 200 for `/`, `/manus-routes.json` and `/api/app/release`; verify Node adapter health and Shield-off responses; and confirm the requested episode resolves successfully and its same-origin proxy returns an HLS playlist.
- [ ] After the checkpoint-triggered automatic publish actually starts, confirm its successful result and that the live watch page no longer stays locked. Do not search for or poll the earlier publish that was blocked before deployment, and do not submit a duplicate publish request for this checkpoint.

## Scope and credentials
- [x] Do not push to or otherwise modify the supplied source GitHub repository; preserve the Cloudflare Pages files and use the Manus-managed canonical repository only.
- [x] Do not enable the managed database, embed private values in source/Git/image/frontend, or ask the user to paste secrets into chat. No `SHIELD_SECRET` is required for the documented Shield-off mode.