# Next.js migration plan

Move the portfolio from hand-wired static HTML + ES modules to **Next.js (App Router, TypeScript, static export to GitHub Pages)**. The work is split into independent slices so several implementation agents can work on them in parallel.

- **Status:** draft for review
- **Implementation agents:** Sonnet (`model: "sonnet"`), one slice per agent, each in its own git worktree
- **Ground rule:** this is a **port, not a redesign**. Every pixel, animation, URL and CV byte should match the current site. Improvements go in follow-ups (§10).

---

## 1. Goals and non-goals

**Goals**
1. Same site, same behaviour, built with Next.js + TypeScript (strict).
2. Keep the clean-architecture layering (`content → domain → shared → shell → sections`), with the section contract enforced by types instead of runtime checks.
3. Replace vendored libraries with npm packages (`gsap`, `lenis`, `three`), and drop the hand-maintained modulepreload list.
4. Keep the CI/CD guarantees: CV validation, unit tests, a PDF rendered on every PR, and a fresh PDF on every deploy to GitHub Pages.
5. Keep the public URLs: `/`, `/cv.html` (and `/cv`), `/assets/cv/Nam_Nguyen_Nhat_CV.pdf`.

**Non-goals (for this migration)**
- No visual redesign, no copy changes, no new sections.
- No CSS Modules or Tailwind. Global CSS keeps the existing cascade (see D6).
- No rewrite of the imperative widgets into React state. They stay imperative behind the behaviour contract (see D4).
- No server runtime. The output stays a static export.

---

## 2. Key decisions

| # | Decision | Why |
|---|---|---|
| D1 | **Next.js 16.x App Router**, `output: 'export'`, `images.unoptimized`, `trailingSlash: false`. Pin exact versions in S0. | GitHub Pages hosts static files only. `trailingSlash: false` emits `out/cv.html`, so `/cv.html` keeps working. |
| D2 | **TypeScript strict**, path alias `@/* → src/*`. | The section contract, shape names and section ids become compile-time guarantees (today `createScene` throws at runtime on an unknown shape). |
| D3 | **Views are Server Components; behaviours are client-only plain TS.** Each section splits its legacy `template.js` into `View.tsx` (pure markup, rendered at build time, ships no JS) and its legacy `mount`/`onReady` into `behaviour.ts`. | This keeps the separation the repo already has (pure template vs. imperative mount). Markup costs no JS, and React never re-renders animated DOM. |
| D4 | **One client orchestrator (`PageRuntime`) runs every behaviour in registry order inside one `useGSAP` effect.** Sections never mount themselves from their own `useEffect`. | ScrollTrigger pins must be created top to bottom, and the scene must exist before the hero mounts. React effect ordering is too implicit to rely on. This is `main.js`, made idempotent. |
| D5 | **Libraries:** `gsap@3.12.5` (same as vendored), `@gsap/react`, `three@0.169.0` (vendored r169), `lenis@^1.3`. Upgrades are follow-ups. | Parity first. A GSAP or Three upgrade can change easing or shader behaviour and would hide porting bugs. |
| D6 | **Global CSS, same files, same order.** Each route group's root layout imports one ordered `@import` list. Section CSS stays colocated in the section folder. | Behaviours select elements by class (`.ab`, `.tl-row`, `.js-*`), and CSS Modules would hash those names. Cascade order matters, as the legacy `styles.css` notes. |
| D7 | **Two root layouts via route groups:** `(portfolio)` and `(print)`. | The CV must not load portfolio CSS (today `cv.html` loads only `fonts.css` + `cv.css`). Navigating between root layouts triggers a full page load, which is the behaviour we have today. |
| D8 | **Fonts stay as `@font-face` in `fonts.css`**, with absolute `/assets/fonts/...` URLs, plus `<link rel="preload">` from shared metadata. No `next/font`. | The PDF relies on the named families (`Geist`, `Geist Mono`, `Geist Static`), and `next/font` hashes family names. |
| D9 | **Build-time `now`.** `page.tsx` captures `new Date()` once at build and passes it as an ISO string to the runtime. Views and behaviours build `PageContext` from that same value. Live clocks still use `new Date()` at runtime. Add a weekly scheduled deploy. | Server markup and client behaviour must agree, or the timeline bars and stats drift (hydration mismatch). The weekly rebuild keeps "years of experience" fresh. |
| D10 | **Shell services are injected through context**: `ctx.services.navigate(id)`, `.exportCv()`, `.toast(html)`. | Today the hero clicks `.nav-links a` and `.js-export`, and contact imports `app/toast.js`. Injecting services removes those cross-slice DOM couplings (DIP), so the slices can be built independently. |
| D11 | **Tests:** Vitest for unit tests (domain, profile rules, hero commands, pure section logic). Playwright for an e2e smoke test against the built `out/`. Scripts run with `tsx`. | Vitest runs TS + path aliases with no setup. Playwright is already a dependency. |
| D12 | **Lint/format:** ESLint flat config (`eslint-config-next` + `typescript-eslint`) and Prettier (single quotes, semicolons, 2 spaces, `printWidth: 120`). | Next 16 removed `next lint`. One formatter keeps diffs from ten agents consistent. |
| D13 | **Legacy code moves to `legacy/` in S0** and stays runnable (`npx http-server legacy -p 8081`) as the reference implementation until S11 deletes it. | Next treats `src/app/page.js` as a route, which collides with the legacy shell. Agents port from `legacy/src/...` and compare against the running legacy site. |
| D14 | **Lint and tests gate every PR, from S0 onwards.** CI runs format check, lint (`--max-warnings 0`), typecheck, unit tests, build and (from S10) e2e as **separate named steps** on every pull request, including slice PRs into `migrate/nextjs`. A PR template makes each author confirm the same commands passed locally. | A red step names the failure at a glance. Gating from S0, not S10, means no wave-1 PR can merge with lint errors or failing tests, even before S10 lands. |

---

## 3. Target structure

```
next.config.ts            output:'export', images.unoptimized, trailingSlash:false
public/
  .nojekyll
  assets/fonts/*.woff2     (moved from assets/fonts)
  assets/cv/Nam_Nguyen_Nhat_CV.pdf   (local copy; deploy overwrites it in out/)
src/
  app/                     Next routes only, thin
    (portfolio)/layout.tsx   <html>, metadata, JSON-LD, imports styles/portfolio.css
    (portfolio)/page.tsx     <Chrome/> + <SectionFrame>s from registry + <PageRuntime nowISO/>
    (print)/layout.tsx       <html>, metadata (noindex), imports cv/cv.css
    (print)/cv/page.tsx      <CvToolbar/> + <CvSheet profile/>
  content/profile.ts       CV data (single source of truth), typed by domain/types.ts
  domain/                  pure: types.ts, career.ts, profile-rules.ts (no DOM, no libs)
  shared/                  UI kernel (framework-agnostic TS + tiny JSX partials)
    lib.ts                 the ONLY importer of gsap / ScrollTrigger / Lenis
    dom.ts env.ts motion.ts text.ts time.ts random.ts
    ui.tsx                 <Kicker/>, <Icon/>, <ExportButton/>
    metadata.ts            shared <head> bits (icon, font preloads)
    styles/                fonts.css, base.css, ui.css
  shell/                   (was legacy src/app; renamed so it can't collide with Next's app/)
    contract.ts            Block / Behaviour / PageContext / RuntimeContext / ShapeName / SectionId
    registry.ts            ordered blocks (server-safe: metadata + Views)
    behaviours.ts          id → Behaviour map, `satisfies Record<SectionId, Behaviour>`
    context.ts             createPageContext(now): the one place ctx is built
    SectionFrame.tsx       <section id class data-label> wrapper, injects ctx.index
    runtime.tsx            'use client' PageRuntime: the orchestrator (was main.js)
    chrome/                Nav, Hud, Boot, Curtain, Cursor, Backdrop, Footer, Toast (+ CSS)
    services/              navigation, tracker, boot, cursor, reveals, export-cv, smooth-scroll, toast
    scene/                 scene.ts, shapes.ts, shaders.ts (three.js)
  sections/<name>/
    index.ts               defineSection({ id, kind, label, shape, View, ... })  (no gsap import)
    View.tsx               markup (Server Component: no hooks, no window, no Date.now/Math.random)
    behaviour.ts           defineBehaviour({ mount, onReady })                    (client only)
    content.ts             copy/config (optional)
    widgets/*.ts           one imperative widget per file (optional)
    <name>.css
  cv/                      CvSheet.tsx, CvToolbar.tsx ('use client' island), cv.css
  styles/portfolio.css     ordered @import list (shared → shell → sections → footer/toast)
scripts/                   validate-profile.ts, build-pdf.ts
tests/                     Vitest unit tests + fixtures/profile.ts
e2e/                       Playwright smoke tests against out/
legacy/                    reference implementation, deleted in S11
```

---

## 4. Contracts frozen by S0

Wave-1 agents code against these and **must not change them**. If a slice needs a contract change, it stops and reports to the integrator.

```ts
// src/shell/contract.ts
import type { ReactNode } from 'react';
import type { CareerStats, Profile, Role } from '@/domain/types';

export type SectionId = 'hero' | 'about' | 'experience' | 'stack' | 'marquee' | 'credentials' | 'contact';
export type ShapeName = 'core' | 'helix' | 'lattice' | 'network' | 'knot' | 'portal';

export interface Env { reducedMotion: boolean; finePointer: boolean }

export interface SceneHandle {
  setProgress(p: number): void;            // float index into the shape sequence
  snap(): void;                            // jump to target (behind the nav curtain)
  anchor(shape: ShapeName): { x: number; y: number; r: number };
  dispose(): void;
}

export interface ShellServices {
  navigate(id: SectionId): void;           // curtain jump (replaces clicking .nav-links a)
  exportCv(): void;                        // download + toast (replaces clicking .js-export)
  toast(html: string): void;
}

/** Data only; safe for Server Components. */
export interface PageContext {
  profile: Profile;
  roles: Role[];                           // oldest first
  stats: CareerStats;
  now: Date;                               // build time (D9)
  index: number;                           // position among sections (hero = 0)
}

/** What behaviours get: data + runtime environment + services. */
export interface RuntimeContext extends PageContext {
  env: Env;
  scene: SceneHandle | null;               // null without WebGL
  services: ShellServices;
  navTargets: SectionId[];                 // sections shown in the nav, in order
  signal: AbortSignal;                     // aborted on teardown; pass to every addEventListener
}

export type Cleanup = () => void;
export interface Behaviour {
  mount?(root: HTMLElement | null, ctx: RuntimeContext): Cleanup | void;
  onReady?(root: HTMLElement | null, ctx: RuntimeContext): void;
}

interface BlockBase<Id extends SectionId = SectionId> {
  id: Id;
  View: (props: { ctx: PageContext }) => ReactNode;
}
export interface SectionBlock extends BlockBase {
  kind: 'section'; label: string; shape: ShapeName; navLabel?: string; nav?: boolean; className?: string;
}
export interface StripBlock extends BlockBase { kind: 'strip' }
export type Block = SectionBlock | StripBlock;

export const defineSection = <B extends Block>(b: B): Readonly<B> => Object.freeze(b);
export const defineBehaviour = (b: Behaviour): Readonly<Behaviour> => Object.freeze(b);
```

```ts
// src/shell/registry.ts — order = page order = mount order = nav numbers = shape sequence
export const blocks = [hero, about, experience, stack, marquee, credentials, contact] as const satisfies readonly Block[];
export const sections = blocks.filter((b): b is SectionBlock => b.kind === 'section');

// src/shell/behaviours.ts — no order here (order lives only in registry.ts)
export const behaviours = { hero, about, experience, stack, marquee, credentials, contact } satisfies Record<SectionId, Behaviour>;

// src/shell/scene/shapes.ts (S2) must satisfy:  export const SHAPES = {...} satisfies Record<ShapeName, Shape>;
```

**Shell modules S0 stubs with their final signatures** (S1 and S2 replace the bodies only):

```ts
createScene(canvas: HTMLCanvasElement, opts: { shapes: ShapeName[]; reducedMotion: boolean }): SceneHandle  // throws without WebGL
createSmoothScroll(env: Env): Lenis | null
attachJumps(opts: { lenis: Lenis | null; scene: SceneHandle | null; reducedMotion: boolean; signal: AbortSignal }): { navigate(id: SectionId): void }
startTracker(opts: { sections: readonly SectionBlock[]; scene: SceneHandle | null; signal: AbortSignal }): Cleanup
attachReveals(): void
chromeIntro(): void
attachCursor(env: Env, signal: AbortSignal): void
createExport(toast: (html: string) => void, signal: AbortSignal): { exportCv(): void }
showToast(html: string): void
boot(env: Env): Promise<void>
```

**Runtime sequence** (`shell/runtime.tsx`, S0). It mirrors `legacy/src/main.js`, running inside `useGSAP(() => {...}, [])`, so `gsap.context` reverts every tween and ScrollTrigger on teardown:

1. `ctx = createPageContext(new Date(nowISO))`, `controller = new AbortController()`
2. `scene = tryCreateScene()` (on failure: warn, hide `#webgl`, `null`)
3. `lenis = createSmoothScroll(env)`; `lenis?.stop()`
4. `navigate = attachJumps(...)`; build `services`
5. for each block in registry order: `cleanups.push(behaviours[id].mount?.(root, rctx(block)))`
6. `attachReveals()`, `attachCursor()`, `startTracker()`, `createExport()`
7. `await boot(env)` (guard: bail out if aborted), then `lenis?.start()`, `chromeIntro()`, `onReady` per block in order, `ScrollTrigger.refresh()`, and refresh again on `document.fonts.ready`
8. teardown: `controller.abort()`, run cleanups in reverse, `scene?.dispose()`, `lenis?.destroy()`

---

## 5. Waves and dependencies

```
Wave 0 (1 agent, blocking)      S0 Foundation
                                     │  merged into integration branch `migrate/nextjs`
          ┌──────────┬──────────┬────┴─────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
Wave 1    S1 Shell   S2 Scene   S3 Hero    S4 About   S5 Exper.  S6 Stack   S7 Creds   S8 Contact S9 CV+PDF  S10 CI/E2E
(10 agents in parallel; disjoint files; merge in any order)
          └──────────┴──────────┴────┬─────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
Wave 2 (1 agent)                S11 Integration, parity QA, legacy removal, docs → PR to main
```

Each wave-1 slice can be verified on its own because S0 delivers a page that already builds and runs: stubbed sections, scene = `null`, and boot resolving immediately. A slice replaces its stub and checks itself against `legacy/`.

### File ownership (after S0)

Agents may only create or modify files under their own paths. The lockfile and `package.json` are frozen in wave 1. If a slice needs a new dependency, it says so in its PR and S11 adds it.

| Slice | Owns |
|---|---|
| S0 | everything listed in S0, then hands over |
| S1 | `src/shell/chrome/**`, `src/shell/services/**` |
| S2 | `src/shell/scene/**`, `tests/scene/**` |
| S3 | `src/sections/hero/**`, `tests/sections/hero/**` |
| S4 | `src/sections/about/**`, `tests/sections/about/**` |
| S5 | `src/sections/experience/**`, `tests/sections/experience/**` |
| S6 | `src/sections/stack/**`, `tests/sections/stack/**` |
| S7 | `src/sections/credentials/**`, `tests/sections/credentials/**` |
| S8 | `src/sections/contact/**`, `src/sections/marquee/**`, `tests/sections/contact/**` |
| S9 | `src/app/(print)/**`, `src/cv/**`, `scripts/build-pdf.ts` |
| S10 | `.github/**`, `e2e/**`, `playwright.config.ts` |
| S11 | everything (integration) |

Frozen in wave 1 (S0 output, changed only by S11): `src/shell/{contract,registry,behaviours,context,runtime,SectionFrame}.*`, `src/shared/**`, `src/domain/**`, `src/content/**`, `src/styles/portfolio.css`, `src/app/(portfolio)/**`, configs.

---

## 6. Slices

Effort: **S** < half a day, **M** ≈ a day, **L** > a day of agent work.

### S0 Foundation (L, blocking)

**Goal:** a Next.js app that builds, lints, type-checks and tests, serves a page with every section stubbed, and freezes the contracts in §4.

Tasks:
1. Create branch `migrate/nextjs` from `main`. `git mv index.html cv.html src assets legacy/`, and port the legacy `tests` to the new layout. Check that `npx http-server legacy -p 8081` still serves the old site.
2. Copy `legacy/assets/fonts` and `legacy/assets/cv` into `public/assets/`, and add `public/.nojekyll`.
3. Scaffold Next 16 (App Router, TS strict, `src/` dir, no Tailwind, no `next/font`). Install with pinned versions: `next react react-dom gsap@3.12.5 @gsap/react three@0.169.0 @types/three lenis`, plus dev deps `typescript eslint eslint-config-next typescript-eslint prettier vitest tsx playwright`.
4. Configure `next.config.ts` (D1), ESLint + Prettier (D12), Vitest (alias `@`), and `tsconfig` paths.
5. Port the pure layers to TS, **with no behaviour change**:
   - `content/profile.ts`
   - `domain/types.ts` (Profile, Experience, Role, CareerStats…), `domain/career.ts`, `domain/profile-rules.ts`
   - `tests/fixtures/profile.ts`, `tests/career.test.ts`, `tests/profile-rules.test.ts`
   - `scripts/validate-profile.ts`, keeping the GitHub annotation output
6. Port the `shared/` kernel to TS:
   - `lib.ts`: npm imports, `registerPlugin` once, client-only
   - `dom.ts`: add `$req(selector, root)`, which throws a descriptive error instead of returning `null`
   - `env.ts`: `getEnv()` reads `matchMedia` lazily, never at module scope, so it can run on the server
   - `motion.ts`: `whileVisible(section, handlers, signal)` gains a `signal` and returns a cleanup
   - `text.ts`, `time.ts`, `random.ts`
   - `ui.tsx`: `<Kicker index label/>`, `<Icon name/>`, `<ExportButton label size/>`, with the same markup as `legacy/src/shared/ui.js`
   - `styles/*`: `fonts.css` with absolute `/assets/fonts` URLs
7. Write `shell/contract.ts`, `registry.ts`, `behaviours.ts`, `context.ts`, `SectionFrame.tsx` and `runtime.tsx` exactly as in §4.
8. Stub every slice-owned module with its final signature: each section gets `index.ts` + `View.tsx` rendering `<Kicker/>` + `TODO <id>`, plus an empty `behaviour.ts` and empty CSS. Also stub `chrome/index.tsx` (`<Chrome sections/>` rendering the elements with the legacy ids and classes, unstyled), the `services/*` no-ops, and `scene/scene.ts` (throws, which yields `scene = null`).
9. Write `styles/portfolio.css` with the full ordered `@import` list from `legacy/src/styles.css`, pointing at the new (empty) file paths.
10. Add `(portfolio)` and `(print)` layouts plus `shared/metadata.ts`: title, description, OG, theme-color, the inline SVG icon, font preloads and the JSON-LD from `legacy/index.html`. Add a stub `(print)/cv/page.tsx`.
11. Add scripts:
    - `dev`, `build`, `start` (`npx serve out`)
    - `format:check` (`prettier --check .`), `format` (`prettier --write .`)
    - `lint` (`eslint . --max-warnings 0`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`)
    - `validate` (`tsx scripts/validate-profile.ts`)
    - `check` (validate + format:check + lint + typecheck + test + build): the one command authors run before pushing
    - `pdf`, `e2e` (placeholders that later slices fill in)
12. Put the quality gate (D14) in place before wave 1 starts:
    - Rewrite `.github/workflows/ci.yml` so the **CV & site checks** job runs on every `pull_request` (any base branch) with one step per check: validate CV, format check, lint, typecheck, unit tests, build. Leave the PDF and e2e steps out until S9 and S10 add them.
    - Point `deploy.yml` at `npm run check` (it only runs on `main`, so it stays inactive until cutover).
    - Add `.github/pull_request_template.md` with a checklist: `npm run check` green locally, tests added for new pure logic, only owned paths touched, legacy-vs-new screenshots attached, "Promote to shared" list.
    - Ask the repository owner to add a ruleset on `migrate/nextjs` requiring **CV & site checks** to pass before merging, the same as `main`.

Acceptance:
- `npm run check` passes, and CI on the S0 PR shows each check as its own green step.
- A deliberate lint error and a deliberate failing test each turn CI red (try both on a throwaway commit, then drop it).
- `out/index.html` contains every `<section id>` in registry order with the correct kicker numbers.
- `out/cv.html` exists.
- Dev server shows no hydration warnings.
- `legacy/` still serves the old site.
- The contracts compile, `behaviours.ts` fails `tsc` if a section is missing, and `SHAPES` typing fails if a shape is missing.

### S1 Shell chrome and services (L)

**Source:** `legacy/index.html` (chrome markup), `legacy/src/app/{navigation,tracker,boot,cursor,reveals,export-cv,smooth-scroll,toast}.js`, `legacy/src/app/styles/*.css`.

Tasks:
1. `chrome/`: `Nav` (links generated from `sections`, numbers from position, hero excluded, `nav !== false`), `Hud` (total = `sections.length - 1`), `Boot`, `Curtain`, `Cursor`, `Backdrop` (`#webgl` canvas + fx divs), `Footer` (year from `ctx.now`), `Toast`. Keep the legacy markup, classes and ARIA exactly, and move each CSS file next to its component.
2. `services/`: port each module to TS with the §4 signatures. Every listener uses `signal`; every `gsap.ticker.add` and `ScrollTrigger.addEventListener` returns or registers its removal.
3. `attachJumps` returns `navigate(id)` (the curtain jump). The nav's own `[data-scroll-to]` click handler calls the same function (DRY).
4. `boot()` hides `#boot` instead of `remove()`-ing it, since React owns that node. Do the same for the cursor when it's disabled.
5. `createExport` triggers the PDF download from `/assets/cv/Nam_Nguyen_Nhat_CV.pdf` and shows the toast. `.js-export` anchors keep working without JS (`href` + `download`).

Acceptance:
- Boot plays and can be skipped by click.
- Nav numbers and active state, HUD index/label/progress/fps/coords, curtain jumps, cursor hover on `a, button, [data-hover]`, and the toast all match legacy.
- No DOM writes when values don't change (as in legacy).
- Reduced motion: no boot screen, instant jumps.
- Teardown in StrictMode leaves no duplicate listeners (check with a counter in dev).

### S2 3D scene (M)

**Source:** `legacy/src/app/scene/*`.

Tasks:
1. Port `scene.ts`, `shapes.ts` and `shaders.ts` to TS on npm `three@0.169.0`. `SHAPES satisfies Record<ShapeName, Shape>`.
2. Implement `SceneHandle` including `dispose()`: cancel the RAF, remove listeners via an internal `AbortController`, and dispose of the geometries, materials and renderer.
3. Keep adaptive quality, the mobile particle counts, the DPR cap and the pause on hidden tab.
4. Unit-test the shape generators (correct buffer length, finite values) under Vitest with no WebGL.

Acceptance:
- The morph sequence, rings, dust, pointer parallax/repel and `anchor()` positions match legacy at 1440×900 and 390×844.
- `dispose()` followed by re-create in StrictMode leaves one canvas context and no leaked RAF.

### S3 Hero section (M)

**Source:** `legacy/src/sections/hero/**`, `legacy/tests/hero-shell.test.js`.

Tasks:
1. Split the code into `View.tsx` (markup from `template.js`; `<ExportButton/>`, `<Icon/>`), `content.ts`, `widgets/hud.ts`, `shell/commands.ts` and `shell/terminal.ts`.
2. `commands.ts` takes `targets: ctx.navTargets`. Terminal effects call `ctx.services.navigate` and `ctx.services.exportCv` instead of clicking DOM elements.
3. `behaviour.ts`: scroll drift, the HUD locked to `ctx.scene?.anchor('core')`, the clock, the live loop through `whileVisible`, and the `onReady` intro timeline (scramble, then type `whoami`, then hand the terminal to the visitor).
4. Port the hero-shell tests to Vitest.

Acceptance:
- The name decode, HUD lock-on, terminal typing, interactive commands (`help`, `git log`, `skills`, `cd <section>`, `cv`, `sudo hire nam`) and "try" chips behave as in legacy.
- Works with `scene = null`.

### S4 About section (L)

**Source:** `legacy/src/sections/about/**` (7 widgets).

Tasks:
1. Port `View.tsx`, `content.ts` and one file per widget (`htop`, `chart`, `sparkline`, `heatmap`, `gauge`, `logs`, `uptime`).
2. `behaviour.ts`: the desktop pinned scene and the mobile enter animations via `gsap.matchMedia()` + `MEDIA`, `fitToViewport`, the README token typing, and the live loop through `createLoop` + `whileVisible`, created after the pin.
3. Unit-test the pure parts (`content.ts` builders, seeded heatmap/sparkline data).

Acceptance: matches legacy on desktop (pinned) and mobile, and widgets tick only while on screen.

### S5 Experience section (S–M)

**Source:** `legacy/src/sections/experience/**`.

Tasks:
1. Port `View.tsx` (timeline rows, bars, role cards built from `ctx.roles`), `content.ts` and `timeline.ts`.
2. `behaviour.ts`: the desktop pin with the scrubbed playhead (DOM writes only on change), and on mobile the static chart plus card activation via class (the CSS transition, never a GSAP tween on the same properties).
3. Unit-test `timelineScale` and `colorOf`.

Acceptance: the playhead date, bar fills, the active card and the step counter match legacy at several scroll positions, and the pin length is `innerHeight * N * 0.5`.

### S6 Stack section (L)

**Source:** `legacy/src/sections/stack/**` (6 widgets).

Tasks:
1. Port `View.tsx`, `content.ts`, and the widgets `wires`, `tooltip` (uses `rolesUsing`), `pipeline`, `cluster`, `metrics` and `identity`.
2. `behaviour.ts`: the desktop pinned build-up timeline, step labels, the "built" gate before packets flow, the mobile stacked enter animations, the reduced-motion fully-built state, and `relayout` on refresh with removal on cleanup.
3. Unit-test `toolAt`, `STEPS`/`WIRES` integrity (every wire endpoint exists in `BOXES`), and the tooltip text builder.

Acceptance: the layer-by-layer reveal, wire drawing, packets, CI run, pod self-heal and tooltips match legacy. Nothing ticks off screen.

### S7 Credentials section (M)

**Source:** `legacy/src/sections/credentials/**`.

Tasks:
1. Port `View.tsx` (cards, identicons, seal fill, education/career axis from `lifePath`) and `content.ts`.
2. `behaviour.ts`: the verify sequence driven by classes, holographic tilt via CSS variables (listeners with `signal`), and GSAP on `.cert-wrap` only (never on the transitioned card).
3. Unit-test `sealFill`, `verifyResult`, `identicon` (deterministic) and `lifePath`.

Acceptance: the scan, `$ verify <id>`, ring fill, stamp and tilt match legacy.

### S8 Contact and marquee (S)

**Source:** `legacy/src/sections/{contact,marquee}/**`.

Tasks:
1. Contact: port `View.tsx` and `content.ts`. In `behaviour.ts`, the copy button uses `ctx.services.toast` and falls back to `mailto:`; plus the handshake terminal and the live Hanoi clock with `presence(hour)`.
2. Marquee: `kind: 'strip'`, a `View` that renders the doubled skills row from `allSkills(profile)`, and an empty behaviour.
3. Unit-test `presence`, `endpoints` and `handshake`.

Acceptance: the copy, toast, clock and presence text match legacy, and the marquee loops seamlessly.

### S9 CV route and PDF pipeline (M)

**Source:** `legacy/cv.html`, `legacy/src/cv/**`, `legacy/scripts/build-pdf.mjs`.

Tasks:
1. `(print)/cv/page.tsx` renders `<CvToolbar/>` and `<CvSheet profile/>` (a Server Component ported from `template.js`). `cv.css` is imported by the `(print)` layout only.
2. `CvToolbar` is the only `'use client'` island. It handles the print button and sets `body.is-ready` once `document.fonts.ready` resolves (same contract as today). The "← portfolio" link is a plain `<a href="/">` because it crosses root layouts.
3. `scripts/build-pdf.ts`: serve `out/` (map `/cv` → `cv.html`, serve `/_next/**` and `/assets/**`), wait for `body.is-ready`, and write the PDF to `--out` (default `public/assets/cv/Nam_Nguyen_Nhat_CV.pdf`). Keep the 2-page warning and the GitHub annotation.

Acceptance:
- The PDF renders with the same page count.
- The PDF matches legacy visually: compare page PNGs at 150 dpi and expect no visible diff.
- `/cv.html` and `/cv` both load.

### S10 CI/CD and e2e smoke tests (M)

**Source:** `.github/**`.

Tasks:
1. Setup action: Node 22, `npm ci` with the Playwright browser download skipped, Chrome via `CHROMIUM_PATH`.
2. `ci.yml`: extend the S0 quality gate, keeping the job name **CV & site checks** (branch protection depends on it) and the separate steps. The final order is: validate CV → format check → lint → typecheck → unit tests (Vitest's GitHub reporter, so failures are annotated on the PR diff) → build → render PDF → upload `cv-preview` → e2e (upload the Playwright report as an artifact on failure). Update the step summary to list each check's result.
3. `deploy.yml`: `npm run check`, then `npm run pdf -- --out out/assets/cv/Nam_Nguyen_Nhat_CV.pdf`, then upload `out/` with `upload-pages-artifact`. Add `schedule: cron` weekly (D9).
4. `e2e/` (Playwright against `out/` served statically), at desktop 1440×900 and mobile 390×844, and with reduced motion:
   - no console errors
   - sections appear in registry order with kicker numbers `00…`
   - nav numbers match
   - the boot screen goes away
   - pinned sections get a `.pin-spacer` on desktop and none on mobile
   - a nav jump lands on its section
   - `/cv.html` reaches `body.is-ready`
   - the PDF link returns 200

   Read section ids from `registry.ts` rather than hardcoding them.

Acceptance: green on a PR into `migrate/nextjs` (sections may still be stubs, since the tests are written against the contract).

### S11 Integration, parity and cleanup (M, after wave 1)

Tasks:
1. Merge all wave-1 PRs. Resolve seams and add any dependencies the slices requested.
2. Deduplicate the helpers that slices listed under "promote to shared" into `src/shared`.
3. Parity: Playwright screenshots of legacy vs. new at about 12 scroll positions per viewport. Review every diff and fix regressions.
4. Performance: the Lighthouse score is not below legacy; JS for `/` is three + gsap + lenis + app; no layout reads per frame (spot-check with a performance trace).
5. Delete `legacy/`, `scripts/preload.mjs` and the vendored libs. Rewrite `README.md` and `CLAUDE.md` for the new structure, keeping the gotchas list (§7) and the "add a section" recipe.
6. Open a PR from `migrate/nextjs` to `main`. The first deploy is the cutover. Rollback is reverting the merge.

---

## 7. Engineering standards (every agent)

### SOLID, made concrete for this codebase
- **S, single responsibility.** `View.tsx` is markup only. `behaviour.ts` orchestrates animation for one section. Each widget file is one widget. `content.ts` is data and pure builders. A file importing both `react` and `gsap` is a smell; only `runtime.tsx` may do it.
- **O, open/closed.** Adding a section means a new folder plus one line each in `registry.ts`, `behaviours.ts` and `portfolio.css`. Shell code never names a specific section id.
- **L, Liskov substitution.** Every `Behaviour` honours the contract: it works with `scene === null`, with reduced motion, and on desktop and mobile; it returns a cleanup for anything not covered by `gsap.context`; it is idempotent under StrictMode double-mount.
- **I, interface segregation.** Views get `PageContext` (data) only, never env, scene or services. Widgets get only the elements and data they need, never the whole ctx.
- **D, dependency inversion.** Sections depend on `contract.ts`, `ctx.services` and `ctx.scene`, never on shell modules or on another slice's DOM. `gsap`, `ScrollTrigger` and `Lenis` come only from `@/shared/lib`; `three` only from `src/shell/scene`.

### KISS
- Port, don't redesign. Keep the legacy algorithm, the names and the comments that explain *why*.
- No state libraries, no context providers beyond what §4 defines, no new abstractions "for later".
- Prefer plain functions and plain objects. A class needs a reason.
- No new dependencies in wave 1.

### DRY
- One source of truth each: CV data (`profile.ts`), page order (`registry.ts`), breakpoints (`MEDIA`/`NAV_HEIGHT` in `env.ts`), and `ctx` construction (`context.ts`).
- Static markup lives in the View only. A behaviour creates DOM only for dynamic rows (logs, terminal output), escaped with `esc()`.
- Reuse `shared/motion` and `shared/text`. If you need a helper that isn't there, write it locally in your slice and list it under **"Promote to shared"** in your PR. Don't edit `src/shared` in wave 1.

### TypeScript
- `strict`, no `any`, no `@ts-ignore`, no non-null `!` on DOM queries (use `$req`).
- Exported functions declare their parameter and return types. Prefer `satisfies` for config objects so literal types survive.
- Use `as const` for content tables (`STEPS`, `WIRES`, `LEVELS`…).

### Quality gate (D14)
- Run `npm run check` before every push. It must pass with zero lint warnings; don't silence rules with `eslint-disable` (if a rule is wrong for the codebase, raise it with the integrator instead).
- A PR merges only when the **CV & site checks** job is green on its latest commit. A red step is fixed in the same PR, never skipped, retried blindly or deferred.
- Never skip, disable or delete a test to get green (`test.skip`, `.only`, commenting out assertions).

### Testing
- Any pure logic you touch or extract gets a Vitest test under `tests/<area>/`.
- Domain tests use `tests/fixtures/profile.ts`, never the real CV. The only exception is the single "real CV is valid" test.

### React + GSAP rules (new; these are the migration's sharp edges)
1. **Mount only through the runtime.** Never call `gsap`/`ScrollTrigger` from a component's `useEffect`. Pins must be created top to bottom, in registry order.
2. **The page tree is stateless above sections.** ScrollTrigger re-parents pinned sections into `.pin-spacer`, and a React re-render of an ancestor would fight it. Interactive state stays imperative inside behaviours.
3. **Never `remove()` a node React rendered.** Hide it (`hidden`, a class or `visibility`). Write `innerHTML` only into elements the View renders empty and never re-renders.
4. **Deterministic Views.** No `window`, `matchMedia`, `Date.now()`, `new Date()` or `Math.random()` in Views or `content.ts` builders called by Views. Use `ctx.now` and `seededRandom`. Placeholders such as `--:--` get filled in by behaviours.
5. **StrictMode-safe.** Every `addEventListener` gets `{ signal: ctx.signal }`. Every `setInterval`, ticker callback or `ScrollTrigger.addEventListener` is undone in the cleanup.
6. Carry over every legacy gotcha:
   - Use `scrollRange()` for pinned extents, and create `whileVisible` after the pin.
   - Never tween `transform`/`opacity` on an element with a CSS transition on those properties.
   - Desktop/mobile split via `gsap.matchMedia()` + `MEDIA`.
   - No `backdrop-filter` over the canvas.
   - DOM writes only on change.
   - `data-hover` for cursor targets.
   - `data-lenis-prevent` on scrollable panes.

---

## 8. Agent brief (paste into each implementation agent)

```
You are implementing slice <ID> <NAME> of the Next.js migration in nhatnam1507.github.io.
Read docs/nextjs-migration/PLAN.md, all of §2, §4, §5, §7, and your slice in §6. Read CLAUDE.md.
Base branch: migrate/nextjs. Work on branch migrate/nextjs-<id>-<name>; open a PR into migrate/nextjs.

Rules:
- Port from legacy/ (the reference implementation). Same markup, classes, behaviour, timings.
- Touch only the paths your slice owns (§5). Do not edit contracts, shared/, configs, package.json.
  If you are blocked by a contract, stop and report; do not work around it.
- Follow §7 (SOLID/KISS/DRY, TS strict, React+GSAP rules) exactly.
- Before pushing: `npm run check` is green (format, lint with zero warnings, typecheck, unit tests, build);
  after pushing, the CI job "CV & site checks" must be green on your PR before it can merge. Fix red steps in this PR.
- Also before pushing: no console errors or hydration warnings in `npm run dev`;
  compare against `npx http-server legacy -p 8081` at 1440×900 and 390×844, and with reduced motion.

PR description must include: what was ported (legacy file → new file), any deviation from legacy and why,
screenshots legacy vs new (desktop + mobile), tests added, and a "Promote to shared" list (or "none").
```

**Dispatch.** The integrator, an Opus session, runs S0 and S11 itself or with one agent, and fans out wave 1:

```js
Agent({
  description: 'S4 About section',
  subagent_type: 'general-purpose',
  model: 'sonnet',
  isolation: 'worktree',
  prompt: BRIEF.replace('<ID>', 'S4').replace('<NAME>', 'About section'),
})
```

Each PR gets one review pass (`/code-review` against §7 and the slice acceptance list) before it merges into `migrate/nextjs`.

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Pin offsets go wrong because of mount order or late fonts | The single orchestrator mounts in registry order, refreshes after boot and after `fonts.ready`, and the e2e test checks `.pin-spacer` presence and nav-jump landing. |
| Hydration mismatches (time, random, env) | Build-time `now` (D9), deterministic Views (§7 rule 4), and the e2e test fails on console errors. |
| StrictMode double-mount duplicates listeners or loops | `gsap.context` revert, `AbortSignal` everywhere, cleanups returned from `mount`, and a listener counter checked in S1. |
| A slice merges with lint errors or failing tests | CI gates every PR from S0 (D14) with separate lint/test steps, `--max-warnings 0`, and a required-check ruleset on `migrate/nextjs`. |
| Ten parallel agents produce conflicting edits | Disjoint ownership (§5), frozen contracts and lockfile, and a "promote to shared" list instead of edits to shared code. |
| The PDF changes subtly (fonts, page breaks) | Named `@font-face` families kept (D8), the same `is-ready` contract, and a page-PNG diff in S9. |
| URL breakage (`/cv.html`, PDF path) | `trailingSlash: false`, the PDF stays at `/assets/cv/…`, and the e2e test checks both URLs. |
| Weak devices get a heavier bundle | Same libraries as before, Views ship no JS, and S11 compares bundle size and Lighthouse against legacy. |

## 10. Follow-ups (after cutover, not in this plan)
- Upgrade GSAP to 3.15+ and Three to the latest version, one at a time, each with a parity check.
- Lazy-load `three` behind the boot screen.
- Consider CSS Modules per section, once the behaviours select elements by refs or `data-` hooks instead of class names.
- Consider React islands for the hero and contact terminals.
