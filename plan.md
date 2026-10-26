# Zenkai — implementation and design plan

## Approved scope

Port the public Zenkai repository at `https://github.com/nyyrox2/Zenkai/tree/main`, inspected at commit `9584bfc67afae6a3969f4c1ed15b87f9705a2e57`, into this Manus-managed Web project. Preserve its current React/Vite/TypeScript app, product surfaces, visual identity, local assets, and shared API implementation; do not modify the source GitHub repository or invent unrelated features.

The baseline initially excluded production hosting. After the user reported `https://zenkai-lhw34qff.manus.space/watch/212888` showing “Media Playback Locked” and asked to fix it, browser inspection confirmed that `GET https://zenkai-lhw34qff.manus.space/api/shield/challenge` returns HTTP 500. The user’s “Fix” authorizes adapting the existing API for a Manus server and enabling the one-way managed Server capability. Keep the managed database disabled. The current project’s `publishing.auto_publish` is `true`; a pushed checkpoint may submit publication automatically, so do not submit a duplicate publish request for that same change.

## Implementation approach

- Preserve the existing React 19 + Vite + TypeScript frontend and its source styling. Keep `public/manus-routes.json` synchronized with page routes.
- Preserve `server/handler.js` and its Cloudflare Pages wrappers. Add `server/http.js`, a Node HTTP adapter that converts incoming requests to Web `Request` objects, calls the shared `handle(request, env)`, and streams Web `Response` bodies (including media/proxy bodies) back to Node without buffering entire videos. The adapter serves an unauthenticated `GET /healthz`, honors `PORT` with 3000 as the default, binds `0.0.0.0`, and returns 404 for paths outside its assigned API/proxy/health scope.
- Add the JSON import attribute to `server/mapping.js` so the shared handler’s `public/anime-mapping.json` dependency loads in Node as well as Vite/Cloudflare. Keep the Cloudflare function wrappers intact.
- Align `server/shield.js` with `.env.example`: `SHIELD_SECRET` is optional, and no secret must never fall back to the repository’s hard-coded value. Keep rate limits; with no secret, `/api/shield/challenge` responds `{ "off": true }`, the existing client marks the session verified, and other API/proxy requests pass the token gate. When a protected `SHIELD_SECRET` is configured later, retain the existing proof-of-work and HMAC verification path. No secret is needed or copied into source for this fix.
- Add a multi-stage Node 22 container in `Dockerfile`. The build stage uses the pinned `pnpm@11.25.0`, committed lockfile and reviewed lifecycle policy, then runs the existing build. The runtime stage contains the Node API adapter, shared server modules, package metadata for ESM, and the public anime mapping file; it starts `node server/http.js`. Do not copy development credentials into the image.
- Retain the static build declaration: `corepack pnpm install --frozen-lockfile && corepack pnpm run build`, output directory `dist`. Enable `features.server` only (database remains false), declare the `Dockerfile` and health path `/healthz`, and split published routes in order: `/api/*` to server, `/proxy` to server, `/healthz` to server, then `/*` to static with SPA fallback.
- Keep requests browser-relative and avoid deriving public response URLs from the internal request `Host`. Continue using the existing SSRF validation and provider adapters.
- Validate the clean project build, Node module import, health response, Shield-off response, and the existing Preview routes before checkpointing. Use a read-only cross-check for the complex backend change. Push only to the Manus-managed `origin/main`; do not push upstream. Because auto-publish is enabled, treat publication as checkpoint-triggered and do not make an additional publish call for the same checkpoint.

## Project structure

- `src/App.tsx`, `src/main.tsx`: frontend bootstrap and routes.
- `src/pages/`: Anime, Movies, Manga, Novels, watch/read, library, profile, community, app, and auxiliary pages.
- `src/components/`: navigation, catalogs, player, search, reader, metadata, themes, and interactions.
- `src/services/`, `src/hooks/`, `src/context/`, `src/lib/`, `src/data/`, `src/types/`: browser data clients, async state, app state, helpers, static data, and domain types.
- `server/handler.js` and `server/*.js`: shared API/proxy, streaming resolvers, Shield, manga/novel sources, and mapping. `server/http.js` adapts this Web-standard handler to production Node HTTP while preserving streaming.
- `functions/`: unchanged Cloudflare Pages entry points for the upstream deployment mode.
- `Dockerfile`: Node 22 image build and production API entrypoint.
- `public/`: static frontend assets, logo, route manifest, and the anime mapping consumed by the server.
- `docs/`: supplied project documentation and brand assets.

## Design system (preserve existing source style)

- **Design Movement**: Cinematic anime discovery interface with modern streaming-service editorial framing and restrained glass UI.
- **Core Principles**: (1) Each content world is immediately recognizable by its own accent; (2) poster/cover art leads and chrome stays quiet; (3) dense discovery remains legible through shelves, catalog filters and strong hierarchy; (4) desktop, touch, keyboard and TV navigation remain first-class.
- **Color Philosophy**: Neutral light/dark foundations let artwork dominate. Anime owns crimson (`#dc143c` light, `#e8294c` dark), Movies use monochrome, Manga uses indigo (`#4f46e5` / `#8b83ff`), and Novels use amber (`#b45f06` / `#f0a63a`). The profile surface retains its documented monochrome treatment.
- **Layout Paradigm**: A full-height four-door opening chooser leads into section-specific discovery pages; wide poster shelves and filtered catalogs support browsing; title details organize metadata and actions; player and readers use focused full-screen layouts. Retain floating desktop navigation and the mobile bottom dock.
- **Signature Elements**: (1) The four-panel media-world chooser with Japanese section marks; (2) translucent floating navigation and responsive bottom dock; (3) the original ghost/loader and animated progress accents.
- **Interaction Philosophy**: Make section choice, search, playback, and saved progress direct. Preserve command-palette search, section modes, theme toggle, keyboard shortcuts and TV spatial focus behavior; honor reduced-motion preferences.
- **Animation**: Keep the repository's short card entrances, subtle hero/panel transitions and section reveal effects. Preserve `prefers-reduced-motion` overrides; avoid adding motion beyond current behavior.
- **Typography System**: Preserve Inter for interface/body copy and Outfit for display headings. Keep the existing uppercase, letter-spaced eyebrow treatment and compact metadata hierarchy.
- **Brand Essence**: One companion for watching anime and movies, reading manga and novels, and keeping personal progress together; immersive, nimble, personal.
- **Brand Voice**: Direct, playful, and specific to the user's choice. Existing examples: “What are you in the mood for?” and “Can’t decide? Surprise me”.
- **Wordmark & Logo**: Preserve the supplied Zenkai logo asset and custom `Logo` component; do not replace it with a typeset placeholder.
- **Signature Brand Color**: Crimson `#dc143c` for the core Anime identity, with distinct amber, indigo and monochrome section accents.

## Constraints and material trade-offs

Playback on the live domain depends on a working API and proxy server; static assets alone cannot execute Cloudflare Pages Functions. The new Manus deployment will run the existing provider code in a Node container and publish the Vite frontend as static output. Third-party media, AniList, TMDB proxy, manga and novel providers remain external dependencies with their own availability and policies. `SHIELD_SECRET` stays optional; absent means the documented Shield-off behavior, not a hard-coded secret. No managed database, user-specific credential, or source GitHub change is part of this fix. Server enablement is one-way and was authorized by the user’s “Fix” after that constraint was explained.
