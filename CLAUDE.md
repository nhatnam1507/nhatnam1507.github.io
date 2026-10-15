# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A GitHub Pages portfolio for Nam Nguyen Nhat: a scrollytelling site with a Three.js particle scene, GSAP/ScrollTrigger + Lenis animations, and a printable A4 CV (`/cv`) that is rendered to PDF.

It is a **Next.js 16 App Router** app in **TypeScript (strict)**, built as a **static export** (`out/`) for GitHub Pages. There is no server runtime. Libraries come from npm (`gsap`, `@gsap/react`, `lenis`, `three`). See also `AGENTS.md`: this Next.js version differs from older training data, and its docs are in `node_modules/next/dist/docs/`.

## Commands

```sh
npm run dev          # http://localhost:3000 (React StrictMode: effects mount twice)
npm run build        # static export to out/
npm start            # serve out/ on :8080
npm run check        # validate + format:check + lint + typecheck + test + build (what CI runs)
npm run e2e          # Playwright smoke tests against out/ (run `npm run build` first)
npm run pdf          # render out/cv.html → public/assets/cv/Nam_Nguyen_Nhat_CV.pdf (needs a build)
npm run pdf -- --out dist/cv.pdf
npm run format       # prettier --write .
npm run lint         # eslint, zero warnings allowed
npm run validate     # validate the CV source of truth (src/content/profile.ts)
```

Run a single unit test file, or filter by name:

```sh
npx vitest run tests/career.test.ts
npx vitest run -t "dates must"
```

`npm run pdf` and `npm run e2e` need Chromium: set `CHROMIUM_PATH` to a Chrome/Chromium binary, or run `npx playwright install chromium`.

## Architecture

Clean-architecture layering; dependencies point inwards only:

- `src/content/profile.ts` holds the CV data. It is the single source of truth for both the site and the PDF, typed by `src/domain/types.ts`.
- `src/domain/` contains pure rules with no DOM or library imports:
  - `career.ts`: month-index time math, `toRoles`, stats, `rolesUsing`
  - `profile-rules.ts`: CV validation on `unknown` input
- `src/shared/` is the UI kernel: DOM/env helpers, text effects, motion helpers (`whileVisible`, `createLoop`, `fitToViewport`, `scrollRange`), `onAbort`, JSX partials (`Kicker`, `Icon`, `ExportButton`, `cssVars`), site constants, base CSS.
  - `shared/lib.ts` is the **only** module that imports `gsap`, `ScrollTrigger` and `Lenis`. Import them from there.
  - `three` is imported only inside `src/shell/scene/`.
- `src/shell/` is the app shell:
  - `contract.ts` holds the section contract (`SectionId`, `ShapeName`, `PageContext`, `RuntimeContext`, `Behaviour`, `defineSection`, `defineBehaviour`).
  - `registry.ts` and `behaviours.ts` list the blocks.
  - `context.ts` builds the page context.
  - `runtime.tsx` (`PageRuntime`) is the client orchestrator.
  - `chrome/` holds the nav, HUD, boot, curtain, cursor, backdrop, footer and toast components plus their CSS.
  - `services/` holds the imperative shell behaviours.
  - `scene/` holds the Three.js scene.
- `src/sections/<name>/` holds one feature per folder:
  - `index.ts` exports `defineSection({ id, kind, label, shape, View })` (metadata + View; never imports gsap).
  - `View.tsx` is a **Server Component**: markup only, rendered at build time, ships no JS.
  - `behaviour.ts` exports `defineBehaviour({ mount, onReady })`: the imperative animation code, client only.
  - `<name>.css` holds its styles.
  - `content.ts` and `widgets/` are optional.
- `src/cv/` and `src/app/(print)/` hold the printable CV.
  - `CvSheet` is a Server Component.
  - `CvToolbar` is the only `'use client'` island. It handles print and sets `body.is-ready` after fonts load.
- `src/app/` holds the thin routes. `(portfolio)` and `(print)` are **separate root layouts**: the CV never loads portfolio CSS, and links between them are plain `<a>` (full page load).

### The registry drives the page

`src/shell/registry.ts` is the ordered list of blocks, and it determines:
- **Page order** and **mount order**.
- **Nav links and their numbers** (`navSections`, `chrome/Nav.tsx`).
- **The HUD label** (`services/tracker.ts`).
- **The 3D scene shape sequence.** `shape` is typed `ShapeName`, and `SHAPES satisfies Record<ShapeName, Shape>`, so an unknown or missing shape is a type error.
- **The kicker number** in each section heading, from `ctx.index`.

Never hardcode section numbers. `behaviours.ts` maps id → behaviour with `satisfies Record<SectionId, Behaviour>`, so a section missing there is a type error. Order lives only in the registry.

A block with `kind: 'strip'` (e.g. `marquee`) is decorative. It isn't wrapped in a `<section>` and isn't numbered or tracked. `SectionFrame.tsx` wraps each section's View in `<section id class data-label>`.

**To add a section:**
1. Create the folder: `index.ts`, `View.tsx`, `behaviour.ts`, `<name>.css`.
2. Add its id to `SectionId` (and a new shape to `ShapeName` + `SHAPES` if needed).
3. Add it to `registry.ts` in page position and to `behaviours.ts`.
4. Add its CSS to `src/styles/portfolio.css`. That file is the ordered `@import` list, and cascade order matters.

### How behaviours run

`PageRuntime` (`src/shell/runtime.tsx`) runs everything inside **one `useGSAP` effect**, mirroring a classic `main.js`:

1. build ctx from the build-time `now`
2. create the scene (or `null` without WebGL)
3. start Lenis (stopped)
4. set up jumps and export, which provide `ctx.services`
5. **`mount` every block in registry order**
6. reveals, cursor, tracker
7. run the boot screen
8. start Lenis, run every `onReady`, then `ScrollTrigger.refresh()`

Teardown aborts `ctx.signal`, and the `gsap.context` reverts every tween and ScrollTrigger.

Sections never call gsap from a React `useEffect`, and never reach into shell DOM. They use `ctx.services.navigate(id)`, `.exportCv()`, `.toast(html)` and `ctx.navTargets` instead.

## React + GSAP rules (learned during the migration)

- **StrictMode mounts twice in dev.** Every behaviour must be idempotent:
  - Pass `{ signal: ctx.signal }` to every `addEventListener`.
  - Undo intervals, ticker callbacks, `ScrollTrigger.addEventListener` and timers on abort (`onAbort(signal, undo)` from `@/shared/abort`).
  - Tweens created later from timers or scroll callbacks are **not** captured by the gsap context; kill them yourself.
- **Never `remove()` a node React rendered.** Hide it with `hidden`, and add a `[hidden] { display: none }` rule when author CSS sets `display`. Write `innerHTML` only into elements the View renders empty and never re-renders.
- **Views are deterministic.** No `window`, `matchMedia`, `Date.now()`, `new Date()` or `Math.random()` in Views or the content builders they call. Use `ctx.now` (build time) and `seededRandom`. Live clocks fill placeholders in behaviours.
- **The page tree above sections is stateless.** ScrollTrigger re-parents pinned sections into `.pin-spacer`, and a re-render would fight it.

## ScrollTrigger / animation gotchas

- **Pins must be created top to bottom.** The runtime mounts in registry order for this reason. A section mounted before an earlier pinned one computes its trigger positions without that pin's spacing (this once put Stack ~3000px off).
- **Pinned sections live inside a `.pin-spacer`.** Use `scrollRange(section)` from `shared/motion.ts` for anything that measures a section's full scroll extent: the tracker, nav jumps, `whileVisible`. Create `whileVisible` triggers *after* the section's pin exists.
- **Don't GSAP-tween `transform`/`opacity` on an element that also has a CSS `transition` on those properties.** The tween gets stuck mid-state. Animate a wrapper instead (see `.cert-wrap` in credentials), or drive the change with a class and the CSS transition (the experience role cards on mobile).
- **Desktop vs mobile** is split with `gsap.matchMedia()` using `MEDIA.desktop` / `MEDIA.mobile` (899/900px). Pinned scrubbed scenes are desktop-only; phones get enter animations.
- **Performance rules:**
  - No `backdrop-filter` over the animating WebGL canvas (only the nav keeps one).
  - Live widgets run through `createLoop` + `whileVisible`, so they only tick on screen.
  - The tracker measures section offsets on `ScrollTrigger` refresh and does no layout reads per frame.
  - Write to the DOM only when a value changes.
- **Nav jumps** (`services/navigation.ts`) intentionally jump instantly behind a curtain and call `scene.snap()`. Smooth-scrolling through several pinned sections stutters.
- **Cursor hover** reacts to `a, button, [data-hover]`. Add `data-hover` to new interactive elements instead of editing `cursor.ts`.

## CV data, validation and CI/CD

- **Editing `profile.ts`:**
  - Experience entries must be **newest first**.
  - Dates are `"Mon YYYY"` or `"Present"`.
  - `careerStart` (ISO date) must fall in the earliest role's month.
  - `label`, `highlight` and `impact` are portfolio-only fields (timeline label, one-line story, headline metric) that the PDF ignores.
- **`profile-rules.ts` rejects unknown keys on purpose.** A typo like `bulets` is an error, not silently dropped content. If you add a field to the profile, add it to `domain/types.ts`, to the allowed list in `profile-rules.ts`, and to the tests.
- **Unit tests use `tests/fixtures/profile.ts`, not the real CV.** Keep it that way so editing the CV can never break unit tests. The only test that touches the real CV is "the real CV source of truth is valid".
- **Dates are build-time.** The page context uses the build's `now`, so "years of experience" and "Present" roles are as of the last deploy. The Deploy workflow also runs weekly to keep them fresh.
- **CI** (`.github/workflows/ci.yml`, job **CV & site checks**) runs on every pull request, one named step per check:
  1. validate CV
  2. format
  3. lint (zero warnings)
  4. typecheck
  5. unit tests
  6. build
  7. render PDF (uploaded as `cv-preview`)
  8. e2e (Playwright report uploaded on failure)
- **Deploy** (`.github/workflows/deploy.yml`) runs on push to `main` and weekly: `npm run check` → a fresh PDF into `out/assets/cv/` → publish `out/` to GitHub Pages (source: GitHub Actions). The PDF committed in `public/assets/cv/` is only a local copy; the published one is always rebuilt.
- Both workflows use the composite `.github/actions/setup` (Node 22, `npm ci` with the Playwright browser download skipped, the runner's Chrome via `CHROMIUM_PATH`).
- `scripts/build-pdf.ts` serves `out/`, waits for `body.is-ready` (set by `CvToolbar` after fonts load), and warns (doesn't fail) if the CV exceeds 2 pages.
- Never silence the quality gate: no `eslint-disable`, no `@ts-ignore`, no `test.skip`/`.only`.
