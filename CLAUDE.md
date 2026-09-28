# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A GitHub Pages portfolio for Nam Nguyen Nhat: a scrollytelling site with a Three.js particle scene, GSAP/ScrollTrigger + Lenis animations, and a printable A4 CV (`cv.html`) that is rendered to PDF. It is plain HTML/CSS/ES modules with **no build step and no bundler**. Vendored libraries live in `assets/vendor/`. GSAP, ScrollTrigger and Lenis load as classic scripts (window globals); Three.js is an ES module.

## Commands

```sh
npm run serve        # http://localhost:8080; ES modules need http://, not file://
npm run validate     # validate the CV source of truth (src/content/profile.js)
npm test             # node --test "tests/**/*.test.js" (no test framework dependency)
npm run check        # validate + test + modulepreload check (exactly what CI and deploy run)
npm run preload      # regenerate <link rel="modulepreload"> list in index.html
npm run pdf          # render cv.html → assets/cv/Nam_Nguyen_Nhat_CV.pdf
npm run pdf -- --out dist/cv.pdf
```

To run a single test file, or filter tests by name:

```sh
node --test tests/career.test.js
node --test --test-name-pattern="dates must" tests/profile-rules.test.js
```

`npm run pdf` needs Chromium: set `CHROMIUM_PATH` to a Chrome/Chromium binary, or run `npx playwright install chromium`. There is no linter configured in the repo.

## Architecture

Clean-architecture layering; dependencies point inwards only:

- `src/content/profile.js` holds the CV data. It is the single source of truth for both the site and the PDF.
- `src/domain/` contains pure rules with no DOM or library imports, so they run under `node --test`:
  - `career.js`: month-index time math, `toRoles`, stats, `rolesUsing`
  - `profile-rules.js`: CV validation
- `src/shared/` is the UI kernel: DOM/env helpers, text effects, motion helpers, UI partials, base CSS.
  - `shared/lib.js` is the **only** place that touches the `gsap`/`ScrollTrigger`/`Lenis` globals. Import them from there.
- `src/app/` is the shell (nav, HUD tracker, boot screen, cursor, export, reveals, and `scene/` for Three.js), plus the section contract and registry.
- `src/sections/<name>/` holds one feature per folder:
  - `index.js` exports `defineSection({ id, label, shape, template, mount, onReady })`
  - `template.js` is a pure markup function of the page context
  - `<name>.css` holds its styles
  - `content.js` and `widgets/` are optional
- `src/main.js` is the composition root. It builds the context (`profile`, `roles`, `stats`, `now`, `env`), renders the blocks into `<main id="app">`, then mounts them.

### The registry drives the page

`src/app/registry.js` is the ordered list of blocks, and it determines:
- **Page order** and **mount order**.
- **Nav links and their numbers**, via `navigation.js`.
- **The HUD label**, via `tracker.js`.
- **The 3D scene shape sequence.** Each section's `shape` must be a key in `src/app/scene/shapes.js` `SHAPES`, or `createScene` throws.
- **The kicker number** in each section heading, taken from `ctx.index`.

Never hardcode section numbers.

A block with `kind: 'strip'` (e.g. `marquee`) is decorative. It isn't wrapped in a `<section>` and isn't numbered or tracked. `page.js` wraps each section's template in `<section id class="section <id>" data-label>`.

**To add a section:**
1. Create the folder.
2. Add it to `registry.js` in page position.
3. Add its CSS to `src/styles.css`. That file is the ordered `@import` list, and cascade order matters.
4. Run `npm run preload`.

## ScrollTrigger / animation gotchas (learned the hard way)

- **Pins must be created top to bottom.** Sections are mounted in registry order for this reason. A section mounted before an earlier pinned one computes its trigger positions without that pin's spacing (this once put Stack ~3000px off).
- **Pinned sections live inside a `.pin-spacer`.** Use `scrollRange(section)` from `shared/motion.js` for anything that measures a section's full scroll extent: the tracker, nav jumps, `whileVisible`. Create `whileVisible` triggers *after* the section's pin exists.
- **Don't GSAP-tween `transform`/`opacity` on an element that also has a CSS `transition` on those properties.** The tween gets stuck mid-state. Animate a wrapper instead (see `.cert-wrap` in credentials), or drive the change with a class and the CSS transition (the experience role cards on mobile).
- **Desktop vs mobile** is split with `gsap.matchMedia()` using `MEDIA.desktop` / `MEDIA.mobile` (899/900px). Pinned scrubbed scenes are desktop-only; phones get enter animations.
- **Performance rules:**
  - No `backdrop-filter` over the animating WebGL canvas (only the nav keeps one on the portfolio page).
  - Live widgets run through `createLoop` + `whileVisible`, so they only tick on screen.
  - The tracker measures section offsets on `ScrollTrigger` refresh and does no layout reads per frame.
  - Write to the DOM only when a value changes.
- **Nav jumps** (`app/navigation.js`) intentionally jump instantly behind a curtain and call `scene.snap()`. Smooth-scrolling through several pinned sections stutters.
- **Cursor hover** reacts to `a, button, [data-hover]`. Add `data-hover` to new interactive elements instead of editing `cursor.js`.

## CV data, validation and CI/CD

- **Editing `profile.js`:**
  - Experience entries must be **newest first**.
  - Dates are `"Mon YYYY"` or `"Present"`.
  - `careerStart` (ISO date) must fall in the earliest role's month.
  - `label`, `highlight` and `impact` are portfolio-only fields (timeline label, one-line story, headline metric) that the PDF ignores.
- **`profile-rules.js` rejects unknown keys on purpose.** A typo like `bulets` is an error, not silently dropped content. If you add a field to the profile, add it to the allowed list there and to the tests.
- **Domain tests use `tests/fixtures/profile.js`, not the real CV.** Keep it that way so editing the CV can never break unit tests. The only test that touches the real CV is "the real CV source of truth is valid".
- **CI** (`.github/workflows/ci.yml`, job **CV & site checks**) runs on pull requests. It runs `npm run check`, renders the PDF, and uploads it as the `cv-preview` artifact.
- **Deploy** (`.github/workflows/deploy.yml`) runs on push to `main`: checks → fresh PDF → publishes `index.html`, `cv.html`, `.nojekyll`, `assets/` and `src/` to GitHub Pages (source: GitHub Actions). The PDF committed in `assets/cv/` is only a local copy; the published one is always rebuilt.
- Both workflows use the composite `.github/actions/setup` (Node 22, `npm ci` with the Playwright browser download skipped, the runner's Chrome via `CHROMIUM_PATH`).
- `scripts/preload.mjs --check` fails CI if the modulepreload list in `index.html` doesn't match the import graph reachable from `src/main.js`. Run `npm run preload` after adding, moving or removing a module.
- `build-pdf.mjs` waits for `body.is-ready`, which `src/cv/index.js` sets after fonts load. It warns (doesn't fail) if the CV exceeds 2 pages.
