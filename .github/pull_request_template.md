## What

<!-- One or two sentences. For a migration slice: "S<n> <name>" and what was ported (legacy file → new file). -->

## Checklist

- [ ] `npm run check` passes locally (validate, format, lint with zero warnings, typecheck, unit tests, build)
- [ ] Tests added or updated for new or changed pure logic
- [ ] Only paths this change owns are touched (migration slices: see `docs/nextjs-migration/PLAN.md` §5)
- [ ] No console errors or hydration warnings in `npm run dev`
- [ ] Screenshots attached for visual changes (legacy vs new, desktop 1440×900 and mobile 390×844)

## Deviations from legacy

<!-- "none", or what differs and why. -->

## Promote to shared

<!-- Helpers written locally that belong in src/shared, or "none". -->
