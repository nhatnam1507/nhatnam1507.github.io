// The hero terminal's commands are pure, so they're tested like the domain.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCommands, type CommandResult } from '@/sections/hero/shell/commands';
import { SUGGESTIONS } from '@/sections/hero/content';
import { careerStats, toRoles } from '@/domain/career';
import { fixtureProfile } from '../../fixtures/profile';

const NOW = new Date('2026-09-28T12:00:00+07:00');
const profile = fixtureProfile();
const roles = toRoles(profile.experience, NOW);
const shell = createCommands({
  profile,
  roles,
  stats: careerStats(profile, roles, NOW),
  targets: ['about', 'experience', 'stack'],
  clock: () => '12:00:00',
});
const text = (res: CommandResult) => res.lines.map((l) => l.map((t) => t[1]).join('')).join('\n');

test('help lists every documented command', () => {
  const help = text(shell.run('help'));
  for (const name of ['whoami', 'git log', 'skills', 'contact', 'cd', 'cv', 'sudo hire nam']) {
    assert.match(help, new RegExp(name));
  }
});

test('git log prints one line per role, newest first', () => {
  const { lines } = shell.run('git log');
  assert.equal(lines.length, roles.length);
  assert.match(text({ lines: [lines[0]] }), new RegExp(roles.at(-1)?.role ?? '(missing)'));
});

test('cd jumps to known sections only', () => {
  assert.deepEqual(shell.run('cd stack').effect, { goto: 'stack' });
  assert.deepEqual(shell.run('cd ~/about/').effect, { goto: 'about' });
  assert.equal(shell.run('cd nowhere').effect, undefined);
  assert.match(text(shell.run('cd')), /usage: cd <section> — one of about, experience, stack/);
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

test('skills, contact and sudo hire nam print the CV data', () => {
  assert.match(text(shell.run('skills')), /core\s+Go/);
  assert.match(text(shell.run('skills')), /languages\s+Go · C \/ C\+\+/);
  const contact = shell.run('contact');
  assert.deepEqual(contact.lines[0][1], ['a', profile.contact.email, `mailto:${profile.contact.email}`]);
  assert.match(text(shell.run('sudo hire nam')), /permission granted/);
  assert.match(text(shell.run('sudo rm')), /rm: nam is not in the sudoers file/);
});

test('multi-word and argument commands fall back like a shell', () => {
  assert.equal(text(shell.run('git status')), text(shell.run('git log')));
  assert.equal(text(shell.run('cat readme.md')), profile.summary);
  assert.match(text(shell.run('cat nope')), /no such file/);
  assert.equal(text(shell.run('echo hello  world')), 'hello world');
  assert.match(text(shell.run('date')), /^12:00:00 in Hanoi/);
});

test('every "try" suggestion is a command the shell knows', () => {
  for (const cmd of SUGGESTIONS) assert.doesNotMatch(text(shell.run(cmd)), /command not found/);
});

test('names that exist on Object.prototype are unknown commands, not crashes', () => {
  assert.match(text(shell.run('constructor')), /command not found: constructor/);
  assert.match(text(shell.run('__proto__')), /command not found: __proto__/);
});
