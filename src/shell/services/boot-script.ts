// The boot screen's script and timings: pure data and arithmetic, so the
// service itself only deals with the DOM (ported from legacy/src/app/boot.js).

/** `[class, tag, text]` */
export const BOOT_LINES = [
  ['ok', '[  OK  ]', ' mounting /dev/portfolio'],
  ['ok', '[  OK  ]', ' go build ./... ................ done'],
  ['ok', '[  OK  ]', ' kubectl get nodes ............. 7 Ready'],
  ['ok', '[  OK  ]', ' aws sts get-caller-identity ... nam@hanoi'],
  ['ok', '[  OK  ]', ' compiling shaders ............. particles online'],
  ['hl', '>', ' welcome, visitor. scroll to explore.'],
] as const satisfies ReadonlyArray<readonly [string, string, string]>;

/** ms before line `i` is printed */
export const lineDelay = (i: number): number => 120 + i * 170;

/** ms between the last line and the automatic slide-away */
export const FINISH_DELAY = 380;

/** ms between the slide-away starting and the page intro starting underneath */
export const RESOLVE_DELAY = 350;

/** Progress bar width (percent) once line `i` is printed */
export const barPercent = (i: number, total: number = BOOT_LINES.length): number => ((i + 1) / total) * 100;
