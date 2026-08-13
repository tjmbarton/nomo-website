# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A custom-coded website for North Montpelier, an unincorporated village in Vermont. It is explicitly **not** a municipal government site (no permits, taxes, or official records). It serves three co-equal goals: tell the village's story, attract tourism, and inform residents about community resources, events, and grant/project updates.

The project started as a scaffold and is being filled in incrementally. Still pending: some page copy/photography, and a Mapbox token. Placeholder content is marked `[PLACEHOLDER ...]` inline — check for these markers before treating any copy as final. Resolved: the Google Calendar embed on `/events` is wired to the real shared calendar, News pulls from the real Substack publication (`src/lib/substack.ts`), the capstone project entry has real content, and hosting is decided (Hostinger Premium, static export — see README.md "Domain & hosting").

## Commands

```sh
npm install          # install dependencies
npm run dev           # start dev server at localhost:4321 (runs as a background process — see below)
npm run build         # production build to ./dist/
npm run preview       # preview the production build locally
npx astro check       # type-check .astro files and the content schemas
```

There is no test suite or linter configured in this repo yet.

### Dev server is background-managed

`astro dev` (Astro 7) runs as a background daemon, not a foreground process — running `npm run dev` again while one is already running will error. Manage it with:

```sh
npx astro dev stop      # stop the running dev server
npx astro dev status    # check if one is running
npx astro dev logs      # tail its logs
```

## Architecture

**Stack:** Astro 7 (static output) + Tailwind CSS v4 (via `@tailwindcss/vite`, CSS-first config — no `tailwind.config.*` file) + Decap CMS for git-based content editing. No UI framework (React/Vue/etc.) is installed; all components are `.astro`, with small vanilla `<script>` blocks for interactivity (mobile nav toggle, tag/category filters, list/map toggle).

### Content model (`src/content.config.ts`)

Four collections, all using the Astro content layer loader API (not the legacy `src/content/config.ts` collections API):

- `projects` — grant/capstone project updates (`src/content/projects/*.md`), with a `status` of `Ongoing`/`Completed`. Rendered via `getCollection`/`render()` from `astro:content` (not the older `entry.render()` pattern).
- `explore` — tourism entries: trails, the pond, itineraries (`src/content/explore/*.md`).
- `resources` — community directory entries: school, library, general store, churches, businesses, historic sites (`src/content/resources/*.md`), categorized as `Services` / `Civic` / `Businesses` / `Historic Sites`. Schema includes `lat`/`lng` fields already, so the directory doubles as the future Mapbox data source without rework.
- `settings` — a singleton loaded via the `file()` loader from `src/content/settings/homepage.json` (top-level JSON keys become entry IDs), currently just the homepage tagline/hero image.

Editing content = adding/editing markdown files in `src/content/*` (directly, or via the Decap CMS at `/admin`) or the `settings` JSON file. No database.

**News is not a content collection.** Day-to-day News posts live on Substack; `src/lib/substack.ts` fetches the publication's RSS feed at *build time* (Astro components run in Node at build, so `fetch()` works directly in frontmatter — no client JS, no CORS issues) and parses it with a small regex-based RSS extractor rather than pulling in an XML dependency. The fetch is wrapped in a try/catch that falls back to a clearly-labeled placeholder post on failure, so a bad or unset `SUBSTACK_FEED_URL` never breaks the build. `FeaturedStrip.astro` (homepage) and `news/index.astro`'s News section both call `fetchSubstackPosts()`.

### Design tokens

All palette and font tokens live in `src/styles/global.css` under a single `@theme` block — this is the source of truth, not `tailwind.config.mjs` (Tailwind v4 doesn't use a JS config for this). The palette is "Mill & Millpond" (old mill town heritage: `paper`/`card`/`ink`/`forest`/`brick`/`brass`/`granite`), chosen to avoid a generic municipal-blue look. `brass` is documented in that file as decorative-only (contrast ~2.8:1 against `paper`) — don't use it for body text. Fonts (Fraunces + Karla) are self-hosted via `@fontsource`, imported in the same file.

### Page/component structure

- `src/layouts/BaseLayout.astro` — the only layout; wraps every page with `Header`, `Footer`, and the global stylesheet.
- `Hero.astro` (full-bleed dark green, homepage-only) vs. `PageIntro.astro` (plain in-flow title on the page background, used by every other page) — this split is intentional, not incomplete: only `/` gets the big arrival moment, everything else flows straight from the header into page content with no color break.
- `src/pages/` — one file per top-level nav section (`our-story.astro`, `explore.astro`, `community.astro`, `events.astro`, `contact.astro`) plus `news/index.astro` (News from Substack + Projects grid, in that order) and `news/[slug].astro` (Projects detail pages only — Substack posts link out externally and have no local route).
- Filtering UI (the category/view toggle inside `ResourceDirectory.astro`) works by rendering all items server-side with `data-*` attributes, then toggling `.hidden` client-side in a `<script>` block — there's no client-side data fetching or framework state involved.
- `ResourceMapStub.astro` checks `import.meta.env.PUBLIC_MAPBOX_TOKEN` and renders a placeholder when unset; wiring in real Mapbox GL JS there (using the existing `resources` collection's `lat`/`lng`/`category` fields) is the intended next step, not a rewrite.

### Hosting: Hostinger, not Netlify

The site is hosted on Hostinger (Premium plan) as a static export (`npm run build` → upload `dist/` to `public_html`) — see README.md "Domain & hosting" for the deploy steps. Two pieces that used to assume Netlify hosting have been dealt with accordingly: `ContactForm.astro`/`NewsletterSignup.astro` submit via Formspree (`PUBLIC_FORMSPREE_ID` env var) instead of Netlify Forms. `public/admin/config.yml` still uses the `git-gateway` Decap CMS backend (Netlify Identity), which does **not** work on Hostinger — this is a known, documented limitation (README.md), not yet fixed. Until it's swapped to a different backend, edit content by editing files directly in the GitHub repo instead of through `/admin`.

## Read the README

`README.md` has the fuller picture: known placeholders to replace before launch, how to connect/test the Decap CMS, how to activate the Mapbox map, and how to connect the real Substack publication. Read it before making changes in those areas.
