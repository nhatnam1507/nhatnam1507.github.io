# nhatnam1507.github.io

Personal portfolio of **Nam Nguyen Nhat**: a scrollytelling site with a Three.js particle scene, plus a printable CV that exports to PDF.

- `index.html`: the portfolio. A particle "core" changes shape per section (core → helix → lattice → network → knot → portal) as you scroll.
- `cv.html`: an A4 CV template that renders from the same data. It has **Print / Save as PDF** and **Download PDF** buttons.
- `assets/cv/Nam_Nguyen_Nhat_CV.pdf`: the pre-built PDF behind every **Export CV** button.

Everything is static and needs no build step. Three.js, GSAP/ScrollTrigger, Lenis and the Geist fonts are vendored under `assets/`, so the site has no CDN dependencies.

## Structure

```
index.html             portfolio page
cv.html                printable CV template (A4)
assets/js/data.js      ← single source of truth: edit your CV here
assets/js/main.js      rendering, scroll animations, HUD, export
assets/js/scene.js     Three.js particle morph scene
assets/js/cv.js        renders cv.html from data.js
assets/css/            main.css (site), cv.css (print template), fonts.css
assets/vendor/         three, gsap, ScrollTrigger, lenis
assets/cv/             generated PDF
scripts/build-pdf.mjs  headless-Chromium PDF generator
```

## Updating the CV

1. Edit `assets/js/data.js`.
2. Regenerate the PDF:
   ```sh
   npm install          # installs playwright
   npx playwright install chromium   # first time only
   npm run pdf
   ```
3. Commit and push.

Run `npm run serve` to preview locally at http://localhost:8080. It has to be served over HTTP, because opening the file directly breaks ES modules.

## Deploying

This is a user site, so GitHub Pages serves it from the default branch root. Go to **Settings → Pages → Build and deployment**, set the source to *Deploy from a branch*, and pick `main` with `/ (root)`. The site goes live at https://nhatnam1507.github.io.
