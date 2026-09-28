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
tests/                     node --test suites for the pure domain layer
scripts/                   build-pdf.mjs, preload.mjs
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
npm test           # domain unit tests
npm run preload    # after adding/moving a module: refresh <link rel="modulepreload"> in index.html
npm run pdf        # after editing src/content/profile.js: rebuild assets/cv/Nam_Nguyen_Nhat_CV.pdf
```

`npm run pdf` needs `npm install` and `npx playwright install chromium` the first time.

To update the CV, edit `src/content/profile.js` and run `npm run pdf`. Both the site and the PDF read from that one file.

## Deploying

GitHub Pages serves this user site from the default branch root. In **Settings → Pages**, set the source to *Deploy from a branch* and choose `main` with `/ (root)`.
