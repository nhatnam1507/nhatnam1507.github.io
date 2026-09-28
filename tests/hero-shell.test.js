// The hero terminal's commands are pure, so they're tested like the domain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCommands } from '../src/sections/hero/shell/commands.js';
import { careerStats, toRoles } from '../src/domain/career.js';
import { fixtureProfile } from './fixtures/profile.js';

const NOW = new Date('2026-09-28T12:00:00+07:00');
const profile = fixtureProfile();
const roles = toRoles(profile.experience, NOW);
const shell = createCommands({
  profile, roles, stats: careerStats(profile, roles, NOW),
  targets: ['about', 'experience', 'stack'], clock: () => '12:00:00',
});
const text = (res) => res.lines.map((l) => l.map((t) => t[1]).join('')).join('\n');

test('help lists every documented command', () => {
  const help = text(shell.run('help'));
  for (const name of ['whoami', 'git log', 'skills', 'contact', 'cd', 'cv', 'sudo hire nam']) assert.match(help, new RegExp(name));
});

test('git log prints one line per role, newest first', () => {
  const { lines } = shell.run('git log');
  assert.equal(lines.length, roles.length);
  assert.match(text({ lines: [lines[0]] }), new RegExp(roles.at(-1).role));
});

test('cd jumps to known sections only', () => {
  assert.deepEqual(shell.run('cd stack').effect, { goto: 'stack' });
  assert.deepEqual(shell.run('cd ~/about/').effect, { goto: 'about' });
  assert.equal(shell.run('cd nowhere').effect, undefined);
});

test('cv exports, clear clears, unknown commands suggest help', () => {
  assert.deepEqual(shell.run('cv').effect, { export: true });
  assert.deepEqual(shell.run('clear').effect, { clear: true });
  assert.match(text(shell.run('rsync')), /command not found: rsync/);
  assert.deepEqual(shell.run('   ').lines, []);
});

test('tab completion extends to the longest unambiguous prefix', () => {
  assert.equal(shell.complete('who'), 'whoami');
  assert.equal(shell.complete('cd ex'), 'cd experience');
  assert.equal(shell.complete('c'), 'c'); // cd, cat, cv, contact, coffee, clear: ambiguous
  assert.equal(shell.complete('zz'), 'zz');
});
