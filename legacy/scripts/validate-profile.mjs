// Validates the CV source of truth. Exit code 1 on any error.
// Usage: npm run validate
// In GitHub Actions each error is also emitted as an annotation on the
// offending line of src/content/profile.js, so it shows up in the PR diff.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { profile } from '../src/content/profile.js';
import { validateProfile } from '../src/domain/profile-rules.js';

const FILE = 'src/content/profile.js';
const source = await readFile(fileURLToPath(new URL(`../${FILE}`, import.meta.url)), 'utf8');
const lines = source.split('\n');

// 'profile.experience[2].bullets[1]' → the value at that path
const valueAt = (path) => path
  .replace(/^profile\.?/, '')
  .split(/\.|\[(\d+)\]/)
  .filter(Boolean)
  .reduce((v, k) => (v == null ? v : v[k]), profile);

// best-effort line number: where the offending value appears in the source.
// Missing values point at their parent; objects at their first string field.
function lineOf(path) {
  const v = valueAt(path);
  if (v === undefined) {
    const parent = path.replace(/(\.[A-Za-z]+|\[\d+\])$/, '');
    return parent && parent !== path ? lineOf(parent) : 1;
  }
  const field = v && typeof v === 'object' ? Object.entries(v).find(([, x]) => typeof x === 'string') : null;
  const needle = typeof v === 'string' ? v : field ? `${field[0]}: '${field[1]}'` : String(v);
  const i = needle ? lines.findIndex((l) => l.includes(needle)) : -1;
  return i >= 0 ? i + 1 : 1;
}

const errors = validateProfile(profile);
const inCI = process.env.GITHUB_ACTIONS === 'true';

if (!errors.length) {
  console.log(`✓ ${FILE} is valid (${profile.experience.length} roles, ${profile.certificates.length} certificates)`);
  process.exit(0);
}

console.error(`✗ ${FILE} has ${errors.length} problem${errors.length > 1 ? 's' : ''}:\n`);
for (const { path, message } of errors) {
  const line = lineOf(path);
  console.error(`  ${FILE}:${line}  ${path} ${message}`);
  if (inCI) console.log(`::error file=${FILE},line=${line},title=Invalid CV data::${path} ${message}`);
}
process.exit(1);
