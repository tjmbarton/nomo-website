# North Montpelier, VT — Village Website

A custom-coded site for North Montpelier, an unincorporated village in Vermont.
It is **not** a municipal government site — no permits, taxes, or official
records. It tells the village's story, encourages visitors, and gives
residents a place to find community resources, events, and news.

Built with [Astro](https://astro.build) + [Tailwind CSS v4](https://tailwindcss.com) + [Decap CMS](https://decapcms.org).

## Project structure

```text
src/
  content.config.ts     # content collection schemas (projects, explore, resources, settings)
  content/
    projects/            # grant/capstone project updates (local, edited via CMS)
    explore/              # trails, pond, itineraries
    resources/            # community directory entries
    settings/homepage.json  # homepage tagline/hero image (editable via CMS)
  lib/substack.ts        # fetches the News feed from Substack at build time
  components/            # Header, Footer, Hero, PageIntro, cards, forms, map stub, etc.
  layouts/BaseLayout.astro
  pages/                 # the 7 top-level routes
  styles/global.css      # Tailwind import + palette/font design tokens
public/
  admin/                 # Decap CMS (index.html + config.yml)
```

**Note on the homepage hero:** the full-bleed green hero (`Hero.astro`) is
homepage-only by design, so it reads as an arrival moment rather than a
repeated banner. Every other page uses `PageIntro.astro` instead, which
renders the title directly on the page background — the header flows
straight into the content with no color break.

## Commands

| Command           | Action                                       |
| :----------------- | :-------------------------------------------- |
| `npm install`      | Install dependencies                          |
| `npm run dev`      | Start local dev server at `localhost:4321`    |
| `npm run build`    | Build the production site to `./dist/`        |
| `npm run preview`  | Preview the production build locally          |

## Design system

**Palette — "Mill & Millpond"** (old mill town heritage, not municipal blue):
`paper`/`card` (cream backgrounds), `ink` (text), `forest` (primary/nav),
`brick` (secondary/tags), `brass` (decorative accent only — see contrast note
in `src/styles/global.css`), `granite` (muted/secondary text). All tokens live
in `src/styles/global.css` under `@theme` — change them there, not in
individual components.

**Type** — Fraunces (headings, serif, editorial) + Karla (body/UI),
self-hosted via `@fontsource`.

This palette and type pairing are a proposed starting point, not final —
swap the hex values or fonts once real photography and any brand decisions
are in hand.

## Editing content

The **News & Projects** page is deliberately split into two sections with two
different editing workflows, because they update at different speeds and are
written by different people:

- **News** — day-to-day updates, written on **Substack**, not this site.
- **Projects** — longer-lived grant/capstone project entries, edited **on
  this site** (CMS or markdown), because they need a stable page other things
  can link to and get occasional status edits over months, not a stream of posts.

### Adding a News post (Substack)

1. Write and publish the post on the village's Substack publication, same as
   any newsletter post.
2. That's it — no CMS entry needed here. `src/lib/substack.ts` fetches the
   publication's RSS feed **at build time** and the post appears in the News
   section (and the homepage "Latest from the village" strip) automatically
   on the next deploy.

**Connecting Substack:** `SUBSTACK_FEED_URL` in `src/lib/substack.ts` is
currently a placeholder (`northmontpelier.substack.com`). Once the real
publication exists, update both `SUBSTACK_FEED_URL` (append `/feed`) and
`SUBSTACK_PUBLICATION_URL` in that file to the real addresses. Until then,
the News section shows a clearly-labeled placeholder post — the fetch fails
safely (logs a warning, doesn't break the build) rather than showing a broken
page. Because this is a static site, a new Substack post only appears after
the *next rebuild* — on Netlify, a [build hook](https://docs.netlify.com/configure-builds/build-hooks/)
triggered by [Zapier's Substack integration](https://zapier.com/apps/substack/integrations)
(or a daily scheduled rebuild) can automate that; otherwise it shows up the
next time anyone deploys.

### Adding a Project post

Same two options as before:

1. **Editing Markdown directly** in `src/content/projects/*` via GitHub's web
   editor, or
2. **Using the CMS** at `/admin` (Decap CMS, under "News & Projects →
   Projects"), once it's connected to a backend (see below).

Explore entries, village map locations, and Offers & Needs board posts use the
same two options, in `src/content/explore/*`, `src/content/resources/*`, and
`src/content/board/*` respectively. The board is meant to be low-friction to
add to — the CMS link on `/community` deep-links straight to a new board
entry (`/admin/#/collections/board/new`).

### Connecting Decap CMS (do this once you've chosen a host)

`public/admin/config.yml` is configured for the `git-gateway` backend, which
requires **Netlify** hosting (Netlify Identity + Git Gateway) — this is the
zero-backend option and the reason Netlify is the recommended host for this
project. Steps once you're on Netlify:

1. Deploy the site to Netlify.
2. In the Netlify dashboard: **Site settings → Identity → Enable Identity**.
3. Under Identity settings, enable **Git Gateway**.
4. Invite volunteer editors under Identity → Invite users.
5. They log in at `yoursite.com/admin`.

If the team picks **Vercel instead**, `git-gateway` won't work out of the
box — swap the `backend:` block in `public/admin/config.yml` for a GitHub
backend with an OAuth provider (e.g. a small serverless function, or a
hosted provider like [oauth-provider](https://github.com/vencax/netlify-cms-oauth-provider-go)).

### Testing the CMS locally (before any host is chosen)

```sh
npx decap-server
```

Then uncomment `local_backend: true` in `public/admin/config.yml`, run
`npm run dev` in another terminal, and open `localhost:4321/admin`.

## Known placeholders — replace before launch

- **All page copy** marked `[PLACEHOLDER ...]` — homepage tagline, Our Story
  narrative, explore entries, news posts, resource listings.
- **Photography** — every image slot renders a `[PLACEHOLDER PHOTO]` box
  when no image is set. Add real photos via the CMS or by dropping files in
  `public/images/` and referencing them in frontmatter.
- **Contact/volunteer/newsletter forms** — submit via
  [Formspree](https://formspree.io) (`src/components/ContactForm.astro`,
  `NewsletterSignup.astro`). Create a free Formspree account, create one form,
  and add its ID to a `.env` file:
  ```
  PUBLIC_FORMSPREE_ID=your_form_id_here
  ```
  All three forms share that one ID (Formspree's free tier is one form) — each
  submission includes a hidden `_subject` field so you can tell them apart in
  your inbox. Until this is set, the forms render normally but show a small
  "not connected yet" note instead of silently failing.

## Activating the village map

`src/components/ResourceMapStub.astro` renders the interactive village map on
the Explore & Visit page (`src/pages/explore.astro`), pulling marker data from
the `resources` content collection (`src/content/resources/*.md` —
`name`/`category`/`address`/`lat`/`lng`/`link`). It falls back to a clearly
labeled "coming soon" placeholder until a token is set:

1. Create a [Mapbox](https://www.mapbox.com) account and access token.
2. Add `PUBLIC_MAPBOX_TOKEN=your_token_here` to a `.env` file — the map
   activates automatically on the next build/dev reload, no code changes
   needed.

Community Resources (`/community`) is a separate "Offers & Needs" board (the
`board` content collection, `src/content/board/*.md`) — a low-friction mutual
aid bulletin, not tied to the map.

## Domain & hosting

Hosted on **Hostinger** (Premium plan), as a static export — Astro builds to
plain HTML/CSS/JS in `dist/`, so no Node runtime is needed on the server. The
forms already use Formspree (see above) instead of Netlify Forms, so nothing
Netlify-specific is required for the site to function for visitors.

**Deploying a build — automatic (recommended):** `.github/workflows/deploy.yml`
builds the site and force-pushes the compiled static output to a `deploy`
branch on every push to `main` (Hostinger's own Git deployment feature only
syncs files — it doesn't run a build step, so this Action does the building
part it's missing). One-time setup in Hostinger's hPanel:
1. Websites → your site → **Git**.
2. Repository URL: `https://github.com/tjmbarton/nomo-website.git`, branch:
   `deploy`.
3. Deployment path: `public_html` (or `public_html/` — the site root).
4. Enable **auto-deploy** so Hostinger re-pulls the `deploy` branch whenever
   it updates.

That's it from then on — push to `main`, GitHub Actions builds and updates
`deploy`, Hostinger pulls it in. If `PUBLIC_MAPBOX_TOKEN` / `PUBLIC_FORMSPREE_ID`
are ever set, add them as repo secrets (Settings → Secrets and variables →
Actions) so the Action's build picks them up too.

**Deploying a build — manual (fallback):**
1. `npm run build` locally.
2. Upload the contents of `dist/` to `public_html` via Hostinger's File
   Manager or FTP.

**Known limitation:** the Decap CMS at `/admin` uses the `git-gateway`
backend, which requires Netlify Identity — it won't authenticate on
Hostinger. Until it's swapped to a different backend (e.g. Decap's GitHub
OAuth backend, which needs a small OAuth proxy), edit content by cloning the
GitHub repo and editing files directly (locally, or via GitHub's web editor)
rather than through `/admin`.
