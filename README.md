# nhatnam1507.github.io

Personal portfolio of **Nam Nguyen Nhat**: a scrollytelling site with a Three.js particle scene, plus a printable CV that exports to PDF.

It is a **Next.js** (App Router) app in **TypeScript**, built as a static export and hosted on GitHub Pages. Animations use GSAP/ScrollTrigger and Lenis; the fonts are self-hosted Geist.

## Architecture

The code follows clean-architecture layering, adapted to a front end. Dependencies point inwards only: sections and the app shell depend on the shared kernel, the domain and the content, and never the other way round.

```
public/                    static files: fonts, the CV PDF (local copy), .nojekyll
src/
  app/                     Next.js routes only, thin
    (portfolio)/           root layout + page: chrome, sections from the registry, client runtime
    (print)/cv/            root layout + page: the printable CV (no portfolio CSS)
  content/
    profile.ts             the CV data: single source for the site and the PDF
  domain/
    types.ts               the CV's types (Profile, Experience, Role, …)
    career.ts              pure rules: months, tenure, roles, stats, rolesUsing (no DOM, no libs)
    profile-rules.ts       validation rules for the CV source of truth (CI gate)
  shared/                  framework-agnostic UI kernel
    lib.ts                 the only importer of gsap / ScrollTrigger / Lenis
    dom.ts env.ts motion.ts text.ts time.ts random.ts abort.ts site.ts
    ui.tsx                 JSX partials: Kicker, Icon, ExportButton, cssVars
    styles/                tokens + reset (base.css), UI primitives (ui.css), fonts
  shell/                   application shell
    contract.ts            the Section interface every block implements
    registry.ts            ordered list of blocks = the page (nav, HUD, scene all derive from it)
    behaviours.ts          id → behaviour (client half of each block)
    context.ts             builds the page context (profile, roles, stats, now)
    runtime.tsx            the client orchestrator: mounts behaviours in registry order
    SectionFrame.tsx       <section id class data-label> wrapper
    chrome/                Nav, Hud, Boot, Curtain, Cursor, Backdrop, Footer, Toast (+ CSS)
    services/              boot, smooth scroll, nav jumps, tracker, reveals, cursor, export, toast
    scene/                 Three.js scene: scene.ts (renderer), shapes.ts, shaders.ts
  sections/<name>/         one folder per feature
    index.ts               defineSection({ id, kind, label, shape, View })
    View.tsx               markup: a Server Component rendered at build time (ships no JS)
    behaviour.ts           defineBehaviour({ mount, onReady }): the animation code
    <name>.css             the section's styles
    content.ts, widgets/   section copy/config and one module per live widget (optional)
  cv/                      CvSheet (server), CvToolbar (the only client island), cv.css
  styles/portfolio.css     CSS entry: the ordered @import list (shared → shell → sections)
tests/                     Vitest unit tests (domain, CV rules, pure section logic) + a fixture profile
e2e/                       Playwright smoke tests against the static export
scripts/                   validate-profile.ts, build-pdf.ts
.github/                   CI (pull requests) and Deploy (main → GitHub Pages) workflows
```

### Why it is shaped this way

- **One folder per section.** Hero, about, experience, stack, marquee, credentials and contact each own their markup, behaviour and styles.
- **Markup and motion are split.** A section's `View.tsx` is a Server Component: pure markup from the page context, rendered at build time, with no JavaScript shipped for it. Its `behaviour.ts` holds the imperative GSAP/ScrollTrigger code.
- **The registry is the page.** `src/shell/registry.ts` lists the blocks in order. Nav numbers, HUD labels and the 3D shape sequence are all derived from that list, so they can't drift apart. Mount order also follows it, which ScrollTrigger pins require.
- **One orchestrator.** `PageRuntime` mounts every behaviour in registry order inside one `useGSAP` effect, and undoes everything on teardown (React StrictMode mounts twice in development).
- **Open/closed.** To add a section, create `src/sections/<name>/`, list it in `registry.ts` and `behaviours.ts`, and add its CSS to `src/styles/portfolio.css`. Nothing else needs to change.
- **Dependency inversion.**
  - The shell depends only on the `Section` contract, not on concrete sections.
  - Sections reach the shell through injected services (`navigate`, `exportCv`, `toast`), not through its DOM.
  - Libraries are reached through `shared/lib.ts` (and `three` only inside `shell/scene`).
  - The cursor reacts to `[data-hover]` rather than to specific sections' classes.
- **Type-checked wiring.** Section ids and 3D shape names are TypeScript unions, so a missing behaviour or an unknown shape fails the build instead of the page.
- **Pure core.** `domain/` and `content/` have no DOM or library imports, so they are unit-tested in isolation.

## Working on it

```sh
npm install        # first time (npx playwright install chromium for the PDF and e2e)
npm run dev        # http://localhost:3000
npm run check      # validate CV + format + lint + typecheck + unit tests + build (what CI runs)
npm run e2e        # Playwright smoke tests against out/ (after npm run build)
npm run pdf        # optional local preview of the PDF (after npm run build; CI builds the published one)
npm start          # serve the static export on http://localhost:8080
```

## Updating the CV

1. Edit `src/content/profile.ts`. It is the only place CV facts live, and both the site and the PDF read from it.
2. Open a pull request. The **CI** workflow validates the file, runs the checks and renders the PDF. Download the `cv-preview` artifact from the run to review the exact PDF.
3. Merge. The **Deploy** workflow rebuilds the PDF from the merged source and publishes the site. You don't commit a PDF by hand.

The rules in `src/domain/profile-rules.ts` catch:
- unknown or misspelled fields (e.g. `bulets`)
- missing or empty text
- dates that aren't `Mon YYYY` / `Present`
- an end before its start, or a date in the future
- experience that isn't ordered newest first
- duplicate timeline labels
- a `careerStart` that doesn't match the earliest role
- a malformed email or profile link
- limits that would break the layout (badge ≤ 4 chars, ≤ 8 tags, …)

Errors are annotated on the offending line in the PR diff. If the CV grows past 2 pages, the build warns but doesn't fail.

## CI/CD

| workflow | runs on | does |
|---|---|---|
| `.github/workflows/ci.yml` | every pull request | validate CV → format → lint (zero warnings) → typecheck → unit tests → build → render PDF (`cv-preview`) → e2e |
| `.github/workflows/deploy.yml` | push to `main`, weekly, and manual | same checks → fresh PDF → publish `out/` to GitHub Pages |

Each check is its own step, so a red step names the failure. Both workflows use the shared setup in `.github/actions/setup` (Node 22, `npm ci`, and the runner's Chrome for the PDF and e2e). The weekly deploy keeps build-time dates ("years of experience", "Present" roles) current.

**One-time repository settings:**
1. **Settings → Pages → Build and deployment → Source: GitHub Actions.** The Deploy workflow publishes the site, including the freshly built PDF.
2. **Settings → Rules → Rulesets → New branch ruleset** targeting `main`:
   - enable *Require a pull request before merging*
   - enable *Require status checks to pass*, and add **CV & site checks**

   Without this, CI still reports on PRs but can't block a merge.

## Deploying

Merging to `main` deploys automatically through `deploy.yml`, once Pages is set to the *GitHub Actions* source (see above). `public/assets/cv/Nam_Nguyen_Nhat_CV.pdf` in the repo is only a local copy; the published PDF is always rebuilt from `src/content/profile.ts`.
