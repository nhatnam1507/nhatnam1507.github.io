# nhatnam1507.github.io

Personal portfolio of **Nam Nguyen Nhat**: a scrollytelling site with a Three.js particle scene, plus a printable CV that exports to PDF.

It is static HTML, CSS and ES modules with no build step. Three.js, GSAP/ScrollTrigger, Lenis and the Geist fonts are vendored under `assets/`.

## Architecture

The code follows clean-architecture layering, adapted to a front end. Dependencies point inwards only: sections and the app shell depend on the shared kernel, the domain and the content, and never the other way round.

```
index.html                 thin shell: <head>, fixed chrome, <main id="app">, one module script
cv.html                    printable CV shell
assets/                    static public files (fonts, vendor libs, CV pdf) → Next.js /public
src/
  main.js                  composition root: builds the context, renders + mounts sections
  styles.css               CSS entry: the ordered @import list (shared → app → sections)
  content/
    profile.js             the CV data: single source for the site and the PDF
  domain/
    career.js              pure rules: months, tenure, roles, stats, rolesUsing (no DOM, no libs)
    profile-rules.js       validation rules for the CV source of truth (CI gate)
  shared/                  framework-agnostic UI kernel
    dom.js env.js lib.js   $/esc helpers, breakpoints, adapter for gsap/lenis globals
    motion.js text.js      pin ranges, live-while-visible loops, fit-to-viewport; text effects
    random.js ui.js        seeded RNG + hash; kicker / icon / export-button partials
    styles/                tokens + reset (base.css), UI primitives (ui.css), fonts
  app/                     application shell
    contract.js            the Section interface every block implements
    registry.js            ordered list of blocks = the page (nav, HUD, scene all derive from it)
    page.js                render + mount blocks in order
    navigation.js          nav links + curtain jumps     tracker.js   scroll → scene, HUD, nav
    boot.js cursor.js export-cv.js reveals.js smooth-scroll.js
    scene/                 Three.js adapter: scene.js (renderer), shapes.js, shaders.js
    styles/                chrome CSS (nav, hud, boot, curtain, cursor, footer, toast, backdrop)
  sections/                one folder per feature
    <name>/index.js        defineSection({ id, label, shape, template, mount, onReady })
    <name>/template.js     markup: a pure function of the page context
    <name>/<name>.css      the section's styles
    <name>/content.js      section-specific copy/config (optional)
    <name>/widgets/        one module per interactive widget (optional)
  cv/                      print template feature (index.js, template.js, cv.css)
tests/                     node --test suites (domain + CV rules) with a fixture profile
scripts/                   build-pdf.mjs, validate-profile.mjs, preload.mjs
.github/                   CI (pull requests) and Deploy (main → GitHub Pages) workflows
```

### Why it is shaped this way

- **One folder per section.** Hero, about, experience, stack, marquee, credentials and contact each own their markup, behaviour and styles. Each maps 1:1 to a future `<About />` component.
- **The registry is the page.** `src/app/registry.js` lists the blocks in order. Nav numbers, HUD labels and the 3D shape sequence are all derived from that list, so they can't drift apart. Mount order also follows it, which ScrollTrigger pins require.
- **Open/closed.** To add a section, create `src/sections/<name>/`, export `defineSection({...})`, add it to the registry, and add its CSS to `src/styles.css`. Nothing else needs to change.
- **Dependency inversion.**
  - The shell depends only on the `Section` contract, not on concrete sections.
  - Libraries are reached through `shared/lib.js`, so switching to npm imports touches one file.
  - The cursor reacts to `[data-hover]` rather than to specific sections' classes.
- **Pure core.** `domain/career.js` and `content/profile.js` have no DOM or library imports. They run under `node --test` and would move unchanged into a Next.js `lib/` folder or a backend.

### Moving to Next.js later

| here | Next.js |
|---|---|
| `assets/` | `public/` |
| `src/content`, `src/domain` | `lib/` (copy as is) |
| `src/sections/<name>/template.js` + `index.js` | `components/<Name>.tsx` (template → JSX, `mount` → `useEffect`/`useGSAP`) |
| `src/sections/<name>/<name>.css` | `<Name>.module.css` |
| `src/app/registry.js` | the page component rendering sections in order |
| `src/app/*` shell | layout components and hooks |
| `src/shared/lib.js` | `import gsap from 'gsap'` etc. |

## Working on it

```sh
npm run serve      # http://localhost:8080 (ES modules need http://, not file://)
npm run validate   # check src/content/profile.js against the CV rules
npm test           # unit tests (domain + CV rules)
npm run check      # validate + test + preload list check (what CI runs)
npm run preload    # after adding/moving a module: refresh <link rel="modulepreload"> in index.html
npm run pdf        # optional local preview of the PDF (CI builds the published one)
```

`npm run pdf` needs `npm install` and `npx playwright install chromium` the first time.

## Updating the CV

1. Edit `src/content/profile.js`. It is the only place CV facts live, and both the site and the PDF read from it.
2. Open a pull request. The **CI** workflow validates the file, runs the tests and renders the PDF. Download the `cv-preview` artifact from the run to review the exact PDF.
3. Merge. The **Deploy** workflow rebuilds the PDF from the merged source and publishes the site. You don't commit a PDF by hand.

The rules in `src/domain/profile-rules.js` catch:
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
| `.github/workflows/ci.yml` | every pull request | validate CV → tests → preload check → render PDF → upload `cv-preview` |
| `.github/workflows/deploy.yml` | push to `main` (and manual) | same checks → build PDF → publish the site to GitHub Pages |

Both use the shared setup in `.github/actions/setup` (Node 22, `npm ci`, and the runner's Chrome for rendering).

**One-time repository settings:**
1. **Settings → Pages → Build and deployment → Source: GitHub Actions.** The Deploy workflow publishes the site, including the freshly built PDF.
2. **Settings → Rules → Rulesets → New branch ruleset** targeting `main`:
   - enable *Require a pull request before merging*
   - enable *Require status checks to pass*, and add **CV & site checks**

   Without this, CI still reports on PRs but can't block a merge.

## Deploying

Merging to `main` deploys automatically through `deploy.yml`, once Pages is set to the *GitHub Actions* source (see above). `assets/cv/Nam_Nguyen_Nhat_CV.pdf` in the repo is only a local copy; the published PDF is always rebuilt from `src/content/profile.js`.
