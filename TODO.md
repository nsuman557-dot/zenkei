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
- [x] Keep the original Vite `zenkaiApi` development middleware calling `server/handler.js` for `/api/*` and `/proxy` in Preview; do not rewrite the upstream provider or Cloudflare Pages function behavior as part of this baseline.
- [x] Add `public/manus-routes.json` containing the complete non-404 route set from `src/App.tsx`, including dynamic route patterns; verify the running site serves valid JSON at `/manus-routes.json` with HTTP 200.
- [x] Pin the package manager and record lifecycle-script policy before the first install; install from the committed lockfile; register TypeScript post-edit diagnostics before application-code edits; and complete the repository build with `pnpm run build` (the source's `build` script type-checks and then runs Vite).
- [x] Configure and start the Manus Preview service on the project's initialized runtime port only after the source and route manifest are ready; verify the application responds over HTTP.

## Scope boundaries
- [x] Do not push to or otherwise modify the supplied source GitHub repository, add unspecified product features, or publicly publish the site in this baseline. Preserve the Cloudflare Pages function files, but do not claim Manus production hosting is ready; a future production adaptation requires a separate user-approved scope.
- [x] Keep provider/API dependencies and environment variables as documented by the repository. Do not request or embed user secrets for the baseline.