# Zenkai — implementation and design plan

## Approved scope

Port the public Zenkai repository at `https://github.com/nyyrox2/Zenkai/tree/main`, inspected at commit `9584bfc67afae6a3969f4c1ed15b87f9705a2e57`, into this Manus-managed Web project. Preserve the repository's current React/Vite/TypeScript app, its existing product surfaces and behavior, original visual identity and local assets, and its existing API code. Do not invent unspecified features, modify the source GitHub repository, or publish publicly as part of this baseline.

The project description and README are the source of truth for product behavior. The existing app spans Anime, Movies, Manga, and Novels; a landing chooser; catalog, detail, watch/read, library, profile, community and app pages; and keyboard, TV, accessibility, theme and progress features. Preserve the current page and API implementation rather than recreating it in a new starter.

## Implementation approach

- Copy the repository snapshot into this initialized project's root, excluding the source repository's `.git` directory so the existing Manus canonical Git remote and project identity remain intact. Keep supplied logos, imagery, frame assets, JSON mappings, license, documentation, `server/`, `functions/`, and other runtime files.
- Keep the existing Vite + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion + HLS stack. Pin pnpm `11.25.0` in `package.json`, convert the supplied npm lockfile into `pnpm-lock.yaml`, and record a reviewed `allowBuilds` policy in `pnpm-workspace.yaml` before installing. The source npm lock lists only optional `fsevents@2.3.3` with an install script; it is intentionally denied because this Linux Preview does not use it. The source environment requires Node 20+; this Sandbox has Node 22.23.4.
- Declare `@webgpu/types` as a direct development dependency. The supplied `src/lib/upscale.ts` references these ambient types, while `anime4k-webgpu` exposes them only as a peer dependency; the initial clean build confirmed the direct type package was missing.
- Preserve the existing Vite `zenkaiApi` development middleware, which invokes `server/handler.js` for `/api/*` and `/proxy`, plus the existing front-end services and Cloudflare Pages Functions wrappers. This makes the current development API path available in Preview without rewriting provider behavior. The production function wrappers target Cloudflare Pages; the approved scope does not add a Manus production server/container or assert production hosting compatibility.
- Preserve all existing route elements in `src/App.tsx`. Add `public/manus-routes.json` from the actual non-404 page routes (including dynamic path patterns), and keep it synchronized with any route changes.
- Register the project's TypeScript post-edit diagnostics before the first application-code edit. Configure the project's existing runtime port from initialization; do not change ports unless there is a concrete conflict. Establish the development server only after source import and required manifest/configuration files are in place.
- Use `public/logo.png`/the existing `Logo` component and repository artwork. No new decorative/hero image generation is needed for this import.
- Verify by dependency installation using the committed `pnpm-lock.yaml`, `pnpm run build`, automatic TypeScript diagnostics, and an HTTP 200 check of `/manus-routes.json`. Do not perform destructive or real-user-data operations. Do not submit a production publish request.

## Project structure

- `src/App.tsx` and `src/main.tsx`: application bootstrap and route tree.
- `src/pages/`: route-level Anime, Movies, Manga, Novels, watch/read, library, profile, community, app and auxiliary pages.
- `src/components/`: reusable navigation, cards, media player, search, reader, metadata, theme and interaction components.
- `src/services/`: AniList, Jikan, TMDB, manga/novel, releases and API clients.
- `src/hooks/`, `src/context/`, `src/lib/`, `src/data/`, `src/types/`: shared state, persistence, navigation, helpers, static data and domain types.
- `server/`: shared Web-standard API handler and source/provider adapters.
- `functions/`: Cloudflare Pages function entry points wrapping the shared handler.
- `public/`: logo, social image, frame artwork, anime mapping, route manifest and static assets.
- `docs/`: supplied project documentation and brand assets.

## Design system (preserve existing source style)

- **Design Movement**: Cinematic anime discovery interface with modern streaming-service editorial framing and restrained glass UI.
- **Core Principles**: (1) Each content world is immediately recognizable by its own accent; (2) poster/cover art leads and chrome stays quiet; (3) dense discovery remains legible through shelves, catalog filters and strong hierarchy; (4) desktop, touch, keyboard and TV navigation remain first-class.
- **Color Philosophy**: Neutral light/dark foundations let artwork dominate. Anime owns crimson (`#dc143c` light, `#e8294c` dark), Movies use monochrome, Manga uses indigo (`#4f46e5` / `#8b83ff`), and Novels use amber (`#b45f06` / `#f0a63a`). The profile surface retains its documented monochrome treatment.
- **Layout Paradigm**: A full-height four-door opening chooser leads into section-specific discovery pages; wide poster shelves and filtered catalogs support browsing; title details organize metadata and actions; player and readers use focused full-screen layouts. Retain the floating desktop navigation and mobile bottom dock.
- **Signature Elements**: (1) The four-panel media-world chooser with Japanese section marks; (2) translucent floating navigation and responsive bottom dock; (3) the original ghost/loader and animated progress accents.
- **Interaction Philosophy**: Make section choice, search, playback, and saved progress direct. Preserve command-palette search, section modes, theme toggle, keyboard shortcuts and TV spatial focus behavior; honor reduced-motion preferences.
- **Animation**: Keep the repository's short card entrances, subtle hero/panel transitions and section reveal effects. Preserve `prefers-reduced-motion` overrides; avoid adding motion or effects beyond current behavior.
- **Typography System**: Preserve Inter for interface/body copy and Outfit for display headings. Keep the existing uppercase, letter-spaced eyebrow treatment and compact metadata hierarchy.
- **Brand Essence**: One companion for watching anime and movies, reading manga and novels, and keeping personal progress together; immersive, nimble, personal.
- **Brand Voice**: Direct, playful, and specific to the user's choice. Existing examples to preserve: “What are you in the mood for?” and “Can’t decide? Surprise me”.
- **Wordmark & Logo**: Preserve the supplied Zenkai logo asset and the custom `Logo` component; do not replace it with a typeset placeholder.
- **Signature Brand Color**: Crimson `#dc143c` for the core Anime identity, with distinct amber, indigo and monochrome section accents.

## Constraints and material trade-offs

This is a faithful development/Preview import, not a feature expansion or public launch. The front end and Vite Preview can call the repository's development API middleware; its production wrappers are Cloudflare Pages Functions and remain in the repository. Public metadata, artwork and media services are external dependencies; playback, live release data, AniList sync and optional Supabase-backed community behavior remain subject to their documented provider availability and environment configuration. No user-specific tokens will be requested or embedded. A future Manus production deployment would need a separately approved adaptation of the API/runtime and serving configuration.
