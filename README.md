# CILA Gallery

A scroll-driven virtual gallery for Carolina Amat (CILA), built with Astro, Vue, GSAP, and three.js.

## Stack

- **Astro** — site shell, static page generation, multi-page routing
- **Vue 3** — interactive UI islands inside the gallery (overlay, focus modal)
- **GSAP + ScrollTrigger** — camera choreography, scroll scrubbing, eased per-painting motion
- **three.js** — 3D scene rendering
- **Tailwind CSS** — styling with a custom warm palette
- **TypeScript** — strict mode across all source

## Quick start

```bash
npm install
npm run dev
```

Then visit the URL Astro prints (usually `http://localhost:4321`).

Key routes:

- `/` — landing page
- `/gallery` — Room I (Venezuela Impressions), the 3D experience
- `/about`, `/cv`, `/contact` — content pages (currently stubs)

## Project structure

```
cila-gallery/
├── astro.config.mjs        # Astro config with Vue + Tailwind integrations
├── tailwind.config.mjs     # Custom palette and typography tokens
├── tsconfig.json           # Strict TS, ~/* path alias to src/
├── public/
│   └── paintings/          # Drop real painting images here
└── src/
    ├── components/         # Vue components
    │   ├── GalleryRoom.vue     # Hosts the canvas, mounts the scene
    │   ├── GalleryOverlay.vue  # Pinned text that fades in per moment
    │   ├── FocusModal.vue      # Click-to-focus painting view
    │   ├── ScrollHint.vue      # "Scroll to enter" prompt
    │   └── ProgressBar.vue     # Top-of-room progress indicator
    ├── content/
    │   ├── index.ts            # Series barrel export
    │   └── series/
    │       └── venezuela-impressions.ts
    ├── gallery/
    │   ├── init.ts             # Initializer — wires renderer, scene, choreography
    │   ├── scene.ts            # Room geometry + painting placement
    │   ├── choreography.ts     # GSAP timeline + ScrollTrigger setup
    │   ├── moments.ts          # Maps timeline state to overlay text
    │   └── state.ts            # Reactive shared state (Vue + GSAP read/write)
    ├── layouts/
    │   └── Base.astro          # Shared HTML scaffold, fonts, meta
    ├── pages/
    │   ├── index.astro         # Landing
    │   ├── gallery.astro       # Hosts <GalleryRoom client:only="vue" />
    │   ├── about.astro
    │   ├── cv.astro
    │   └── contact.astro
    ├── styles/                 # Reserved for future global CSS
    ├── types.ts                # Domain types (Painting, Series, Moment)
    └── env.d.ts
```

## Architecture

The gallery is a single Vue island mounted inside an otherwise static Astro page. The island wraps a three.js canvas and several reactive UI overlays.

**Data flow:**

```
User scrolls
   ↓
ScrollTrigger updates timeline progress (0-1)
   ↓
GSAP timeline tweens cameraState (z, sway)
   ↓
Render loop applies cameraState → camera position
   ↓
ScrollTrigger.onUpdate writes progress to galleryState (Vue reactive)
   ↓
Vue components (overlay, modal) re-render based on activeMomentIndex
```

**Shared state** (`src/gallery/state.ts`) is the single source of truth. The three.js side and the Vue side both read from it; only mutators write to it. Components consume `readonly(state)` so they can't mutate it directly — all writes go through `setProgress`, `setActiveMoment`, `focusPainting`, etc.

**Why GSAP for camera motion** — the previous prototype used hand-rolled exponential smoothing on raw scroll input. GSAP's ScrollTrigger handles smoothing, scrub lag, pin behavior, and per-painting easing in a way that's both more declarative and more cinematic. Each painting gets approach + linger phases; transitions between paintings have their own ease curve. Easy to tune in `choreography.ts`.

**Why Vue islands instead of vanilla DOM** — the overlay and modal both have non-trivial state (which moment is active, which painting is focused, transition states) that's a pain to manage manually. Vue's `<Transition>` plus `computed` derivations handle it cleanly. Astro's `client:only="vue"` directive keeps Vue out of the static pages and only loads it on `/gallery`.

**Why Astro instead of Vite alone** — proper static site generation for the content pages (landing, about, CV, contact), per-page meta tags for OG previews, file-based routing without Next/Nuxt overhead, and the islands architecture for the gallery page. Lighthouse scores stay high because most of the site ships zero JavaScript.

## Adding paintings

1. Drop image files into `public/paintings/` (specs in that folder's README).
2. In the appropriate series file under `src/content/series/`, set the painting's `image` field to the filename:
   ```ts
   {
     id: 'helicoide-1',
     image: 'helicoide-1.jpg',  // was null
     // ...
   }
   ```
3. Once `image` is set, the placeholder fields are unused.

## Adding a new series (room)

1. Create a new file under `src/content/series/` following the shape of `venezuela-impressions.ts`.
2. Add it to `src/content/index.ts` in the `allSeries` array.
3. Either add a new Astro page (e.g. `src/pages/gallery/sailing.astro`) that mounts `<GalleryRoom seriesId="sailing-in-my-memories" />`, or generalize the existing `gallery.astro` to accept the series ID via the URL.

## Customization

- **Camera choreography** — `src/gallery/choreography.ts`. Per-painting eases, linger times, sway parameters.
- **Room dimensions** — `ROOM` const in `src/gallery/scene.ts`.
- **Painting size on wall** — `PAINTING_W`, `PAINTING_H` in `src/gallery/scene.ts`. Currently fixed; could be made per-painting if accurate physical scale matters.
- **Wall color, lighting, fog** — `src/gallery/scene.ts` and `src/gallery/init.ts`. Test against real images before committing — color tuning should be informed by the actual paintings.
- **Palette** — `tailwind.config.mjs`. Cream + ink families.
- **Typography** — Cormorant Garamond (serif) and Inter (sans), loaded from Google Fonts in `Base.astro`.

## Build & deploy

```bash
npm run build
```

Outputs static files to `dist/`. Deploys cleanly to Netlify, Vercel, Cloudflare Pages, or any static host. No server runtime required.

## Roadmap

- [ ] Real painting textures + color tuning pass
- [ ] Remaining 7 series authored
- [ ] Lobby / hub that links to each room
- [ ] Transition between rooms
- [ ] Real artist statement content per series
- [ ] Cycling hero on landing page (currently a static placeholder)
- [ ] 2D archive / works grid view as alternative browse mode
- [ ] Inquiry flow on focus view
- [ ] Optional ambient room audio (toggle)
- [ ] Custom postprocessing pass (subtle film grain or color grade)
- [ ] Lighthouse / accessibility / SEO audit before launch

## License

Private — for Carolina Amat's use. Code by JB.
