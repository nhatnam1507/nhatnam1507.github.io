// Domain rules for the CV source of truth (src/content/profile.js). Pure: no DOM, no Node APIs,
// so the same rules run in CI (scripts/validate-profile.mjs), in unit tests
// and, if ever needed, in the browser.
//
// Returns a list of { path, message }; an empty list means the profile is valid.
// Unknown keys are errors on purpose: a typo like `bulets` would otherwise
// silently drop content from the site and the PDF.

import { parseMonth } from './career.js';

const MONTH_RE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createChecker() {
  const errors = [];
  const fail = (path, message) => errors.push({ path, message });

  const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

  const text = (obj, key, path, { min = 1, max = Infinity, optional = false } = {}) => {
    const v = obj?.[key];
    const at = `${path}.${key}`;
    if (v === undefined && optional) return;
    if (typeof v !== 'string') return fail(at, `must be a string, got ${v === undefined ? 'nothing' : typeof v}`);
    const t = v.trim();
    if (t.length < min) return fail(at, min === 1 ? 'must not be empty' : `must be at least ${min} characters`);
    if (t.length > max) fail(at, `is ${t.length} characters, max ${max}`);
    if (t !== v) fail(at, 'has leading or trailing whitespace');
  };

  const list = (obj, key, path, { min = 1, max = Infinity } = {}) => {
    const v = obj?.[key];
    const at = `${path}.${key}`;
    if (!Array.isArray(v)) { fail(at, 'must be an array'); return []; }
    if (v.length < min) fail(at, `needs at least ${min} item${min > 1 ? 's' : ''}`);
    if (v.length > max) fail(at, `has ${v.length} items, max ${max}`);
    return v;
  };

  const strings = (obj, key, path, opts = {}) => {
    const items = list(obj, key, path, opts);
    const seen = new Set();
    items.forEach((s, i) => {
      if (typeof s !== 'string' || !s.trim()) fail(`${path}.${key}[${i}]`, 'must be a non-empty string');
      else if (seen.has(s)) fail(`${path}.${key}[${i}]`, `duplicate "${s}"`);
      else seen.add(s);
      if (typeof s === 'string' && opts.maxLength && s.length > opts.maxLength) fail(`${path}.${key}[${i}]`, `is ${s.length} characters, max ${opts.maxLength}`);
    });
    return items;
  };

  const month = (obj, key, path, { allowPresent = false } = {}) => {
    const v = obj?.[key];
    if (allowPresent && v === 'Present') return true;
    if (typeof v !== 'string' || !MONTH_RE.test(v)) {
      fail(`${path}.${key}`, `must look like "Mar 2026"${allowPresent ? ' or be "Present"' : ''}, got ${JSON.stringify(v)}`);
      return false;
    }
    return true;
  };

  const keys = (obj, path, allowed) => {
    if (!isObject(obj)) { fail(path, 'must be an object'); return false; }
    Object.keys(obj).filter((k) => !allowed.includes(k)).forEach((k) => fail(`${path}.${k}`, `unknown field (allowed: ${allowed.join(', ')})`));
    return true;
  };

  return { errors, fail, text, list, strings, month, keys, isObject };
}

/**
 * @param {object} profile
 * @param {{ now?: Date }} [options]
 * @returns {{ path: string, message: string }[]}
 */
export function validateProfile(profile, { now = new Date() } = {}) {
  const c = createChecker();
  const P = 'profile';
  if (!c.keys(profile, P, ['name', 'title', 'tagline', 'location', 'careerStart', 'contact', 'summary', 'experience', 'education', 'certificates', 'skills'])) return c.errors;

  ['name', 'title', 'tagline', 'location'].forEach((k) => c.text(profile, k, P, { max: 80 }));
  c.text(profile, 'summary', P, { min: 50, max: 800 });

  // careerStart drives "N years" everywhere, so it must be a real past date
  const cs = profile.careerStart;
  if (typeof cs !== 'string' || !ISO_DATE_RE.test(cs) || Number.isNaN(Date.parse(cs))) c.fail(`${P}.careerStart`, `must be an ISO date like "2020-09-01", got ${JSON.stringify(cs)}`);
  else if (new Date(cs) > now) c.fail(`${P}.careerStart`, 'is in the future');

  // contact
  const contact = profile.contact;
  if (c.keys(contact, `${P}.contact`, ['email', 'phone', 'linkedin', 'github'])) {
    c.text(contact, 'email', `${P}.contact`);
    if (typeof contact.email === 'string' && !EMAIL_RE.test(contact.email)) c.fail(`${P}.contact.email`, 'is not a valid email address');
    c.text(contact, 'phone', `${P}.contact`, { optional: true });
    if (typeof contact.phone === 'string' && !/^\+?[\d\s-]{6,20}$/.test(contact.phone)) c.fail(`${P}.contact.phone`, 'must contain only digits, spaces, dashes and an optional leading +');
    [['linkedin', 'linkedin.com/in/'], ['github', 'github.com/']].forEach(([k, prefix]) => {
      c.text(contact, k, `${P}.contact`);
      if (typeof contact[k] === 'string' && !contact[k].startsWith(prefix)) c.fail(`${P}.contact.${k}`, `must start with "${prefix}" (no https://)`);
    });
  }

  // experience: newest first, sane ranges, portfolio fields present
  const roles = c.list(profile, 'experience', P, { max: 15 });
  const labels = new Set();
  let prevStart = Infinity;
  roles.forEach((r, i) => {
    const at = `${P}.experience[${i}]`;
    if (!c.keys(r, at, ['role', 'company', 'project', 'location', 'start', 'end', 'bullets', 'tags', 'label', 'highlight', 'impact'])) return;
    c.text(r, 'role', at, { max: 60 });
    c.text(r, 'company', at, { max: 60 });
    c.text(r, 'project', at, { optional: true, max: 40 });
    c.text(r, 'location', at, { max: 60 });
    c.text(r, 'label', at, { max: 20 });
    c.text(r, 'highlight', at, { min: 20, max: 160 });
    c.strings(r, 'bullets', at, { max: 8, maxLength: 220 });
    c.strings(r, 'tags', at, { max: 8, maxLength: 24 });
    if (c.keys(r.impact, `${at}.impact`, ['value', 'label'])) {
      c.text(r.impact, 'value', `${at}.impact`, { max: 10 });
      c.text(r.impact, 'label', `${at}.impact`, { max: 50 });
    }
    if (typeof r.label === 'string') {
      if (labels.has(r.label)) c.fail(`${at}.label`, `duplicate label "${r.label}" (labels identify roles on the timeline)`);
      labels.add(r.label);
    }
    const okStart = c.month(r, 'start', at);
    const okEnd = c.month(r, 'end', at, { allowPresent: true });
    if (okStart && okEnd) {
      const s = parseMonth(r.start, now), e = parseMonth(r.end, now);
      if (e < s) c.fail(`${at}.end`, `"${r.end}" is before start "${r.start}"`);
      if (s > parseMonth('Present', now)) c.fail(`${at}.start`, `"${r.start}" is in the future`);
      if (s > prevStart) c.fail(`${at}.start`, 'experience must be ordered newest first');
      prevStart = s;
    }
  });

  // careerStart should be when the earliest role began
  if (roles.length && typeof cs === 'string' && ISO_DATE_RE.test(cs)) {
    const starts = roles.map((r) => (MONTH_RE.test(r?.start) ? parseMonth(r.start, now) : Infinity));
    const earliest = Math.min(...starts);
    const d = new Date(cs);
    if (Number.isFinite(earliest) && d.getFullYear() * 12 + d.getMonth() !== earliest) {
      c.fail(`${P}.careerStart`, `should be in the same month as the earliest role (${roles[starts.indexOf(earliest)].start})`);
    }
  }

  // education
  c.list(profile, 'education', P, { max: 5 }).forEach((e, i) => {
    const at = `${P}.education[${i}]`;
    if (!c.keys(e, at, ['school', 'degree', 'start', 'end'])) return;
    c.text(e, 'school', at);
    c.text(e, 'degree', at);
    if (c.month(e, 'start', at) && c.month(e, 'end', at, { allowPresent: true }) && parseMonth(e.end, now) < parseMonth(e.start, now)) c.fail(`${at}.end`, 'is before start');
  });

  // certificates
  c.list(profile, 'certificates', P, { min: 0, max: 9 }).forEach((x, i) => {
    const at = `${P}.certificates[${i}]`;
    if (!c.keys(x, at, ['name', 'short', 'issuer', 'id', 'date', 'badge'])) return;
    ['name', 'issuer', 'id', 'date'].forEach((k) => c.text(x, k, at, { max: 80 }));
    c.text(x, 'short', at, { max: 30 });
    c.text(x, 'badge', at, { max: 4 }); // shown in a small square badge
  });

  // skills
  if (c.keys(profile.skills, `${P}.skills`, ['core', 'exploring', 'groups'])) {
    c.strings(profile.skills, 'core', `${P}.skills`, { max: 8 });
    c.strings(profile.skills, 'exploring', `${P}.skills`, { min: 0, max: 6 });
    c.list(profile.skills, 'groups', `${P}.skills`).forEach((g, i) => {
      const at = `${P}.skills.groups[${i}]`;
      if (!c.keys(g, at, ['label', 'items'])) return;
      c.text(g, 'label', at, { max: 20 });
      c.strings(g, 'items', at, { max: 10 });
    });
  }

  return c.errors;
}
