// Presentation rules for the credential cards and the education → career path.
import { monthIndex, parseMonth } from '../../domain/career.js';
import { seededRandom, shortHash } from '../../shared/random.js';

/** '810 / 990' → 0.818 (how full the seal's ring is); pass/fail certs → 1 */
export function sealFill(cert) {
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(cert.id);
  return m ? Number(m[1]) / Number(m[2]) : 1;
}

/** What `$ verify` prints once the check completes. */
export const verifyResult = (cert) =>
  /^\d+\s*\//.test(cert.id) ? `score ${cert.id.replace(/\s/g, '')} · ${Math.round(sealFill(cert) * 100)}% of max` : `record found · ${cert.date}`;

/**
 * A 5×5 mirrored identicon (GitHub-avatar style) derived from the credential
 * id, so each card carries its own stable "fingerprint". Returns 25 booleans.
 */
export function identicon(id, size = 5) {
  const rand = seededRandom(parseInt(shortHash(id), 16));
  const half = Math.ceil(size / 2);
  const cols = Array.from({ length: half }, () => Array.from({ length: size }, () => rand() > 0.45));
  return Array.from({ length: size * size }, (_, i) => {
    const r = Math.floor(i / size), c = i % size;
    return cols[Math.min(c, size - 1 - c)][r];
  });
}

/**
 * Education and career on one scale: compile (degree) → deploy (first job) →
 * runtime (now). Positions are percentages along the bar.
 */
export function lifePath({ education, careerStart }, now) {
  const edu = education[0];
  const start = parseMonth(edu.start, now);
  const graduated = parseMonth(edu.end, now);
  const [y, m] = careerStart.split('-').map(Number);
  const deployed = y * 12 + m - 1;
  const today = monthIndex(now);
  const span = Math.max(1, today - start);
  const at = (mi) => ((mi - start) / span) * 100;
  const firstYear = Math.floor(start / 12) + 1;
  const lastYear = Math.floor(today / 12);
  return {
    stops: { graduated: at(graduated), deployed: at(deployed) },
    months: { study: graduated - start, gap: deployed - graduated, career: today - deployed },
    years: Array.from({ length: lastYear - firstYear + 1 }, (_, i) => ({ year: firstYear + i, at: at((firstYear + i) * 12) })),
  };
}
