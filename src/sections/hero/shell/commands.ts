// The hero terminal's commands. Pure: a command line in, output lines and an
// optional side effect out, so it runs under Vitest with no DOM.
//
// A line is a list of tokens: [class, text] or ['a', text, href].
// An effect is { goto: sectionId } | { export: true } | { clear: true }.
import { tenure } from '@/domain/career';
import type { Profile, Role, CareerStats } from '@/domain/types';
import type { SectionId } from '@/shell/contract';
import { shortHash } from '@/shared/random';

/** `[class, text]`, or `['a', text, href]` for a link. */
export type Token = readonly [cls: string, text: string, href?: string];
export type Line = readonly Token[];
export type Effect = { goto: SectionId } | { export: true } | { clear: true };
/** Effects the shell acts on (`clear` is handled by the terminal itself). */
export type ShellEffect = Exclude<Effect, { clear: true }>;
export interface CommandResult {
  lines: Line[];
  effect?: Effect;
}

interface Command {
  /** shown by `help`; commands without it are easter eggs */
  about?: string;
  run(arg?: string): CommandResult;
}

export interface CommandDeps {
  profile: Profile;
  /** domain Role[] (oldest first) */
  roles: readonly Role[];
  stats: CareerStats;
  /** section ids you can `cd` into */
  targets: readonly SectionId[];
  /** current time in Hanoi, 'HH:MM:SS' */
  clock: () => string;
}

export interface Commands {
  /** Run one command line. */
  run(input: string): CommandResult;
  /** Tab completion: the longest unambiguous completion of `input`, or itself. */
  complete(input: string): string;
  names: string[];
}

const out = (text: string): Line => [['o', text]];
const say = (...tokens: Token[]): Line => tokens;

export function createCommands({ profile, roles, stats, targets, clock }: CommandDeps): Commands {
  const { contact } = profile;
  const email: Token = ['a', contact.email, `mailto:${contact.email}`];

  const COMMANDS: Record<string, Command> = {
    help: {
      about: 'list commands',
      run: () => ({
        lines: [
          out('available commands:'),
          ...Object.entries(COMMANDS)
            .filter(([, c]) => c.about)
            .map(([name, c]) => say(['k', name.padEnd(14)], ['c', c.about ?? ''])),
          say(['c', 'tab completes · ↑/↓ history · ctrl+l clears']),
        ],
      }),
    },
    whoami: {
      about: 'who is this',
      run: () => ({
        lines: [
          out(`${profile.name} — ${profile.title} · ${profile.tagline}`),
          out(`based in ${profile.location} (UTC+7)`),
        ],
      }),
    },
    uptime: {
      about: 'career uptime',
      run: () => ({
        lines: [
          out(`up ${stats.years} years · ${stats.employers} companies · ${stats.roles} roles · load average: ☕ ☕ ☕`),
        ],
      }),
    },
    'git log': {
      about: 'career history',
      run: () => ({
        lines: [...roles]
          .reverse()
          .map((r) =>
            say(
              ['s', shortHash(`${r.company}${r.label}${r.startLabel}`)],
              ['o', ' '],
              ['k', `(${r.label})`],
              ['o', ` ${r.role} · ${r.startLabel} → ${r.endLabel} `],
              ['c', `[${tenure(r.months)}]`],
            ),
          ),
      }),
    },
    skills: {
      about: 'what nam works with',
      run: () => ({
        lines: [
          say(['p', 'core      '], ['o', profile.skills.core.join(' · ')]),
          ...profile.skills.groups.map((g) => say(['k', g.label.padEnd(10)], ['o', g.items.join(' · ')])),
          say(['s', 'exploring '], ['o', profile.skills.exploring.join(' · ')]),
        ],
      }),
    },
    contact: {
      about: 'how to reach nam',
      run: () => ({
        lines: [
          say(['c', 'email    '], email),
          say(['c', 'linkedin '], ['a', contact.linkedin, `https://www.${contact.linkedin}`]),
          say(['c', 'github   '], ['a', contact.github, `https://${contact.github}`]),
        ],
      }),
    },
    ls: {
      about: 'list sections',
      run: () => ({ lines: [say(...targets.map((t): Token => ['k', `${t}/  `]), ['o', 'README.md  cv.pdf'])] }),
    },
    cd: {
      about: 'jump to a section',
      run: (arg) => {
        const to = (arg || '').replace(/^[~./]+|\/+$/g, '');
        if (!to) return { lines: [out(`usage: cd <section> — one of ${targets.join(', ')}`)] };
        const target = targets.find((t) => t === to);
        if (!target) return { lines: [out(`cd: no such section: ${to}`)] };
        return { lines: [say(['c', `→ ~/${target}`])], effect: { goto: target } };
      },
    },
    'cat README.md': { about: 'read the summary', run: () => ({ lines: [out(profile.summary)] }) },
    cv: {
      about: 'download the CV (pdf)',
      run: () => ({ lines: [say(['p', '✓ '], ['o', 'exporting Nam_Nguyen_Nhat_CV.pdf …'])], effect: { export: true } }),
    },
    date: { run: () => ({ lines: [out(`${clock()} in Hanoi (UTC+7)`)] }) },
    'sudo hire nam': {
      about: 'you know you want to',
      run: () => ({
        lines: [
          say(['c', '[sudo] password for recruiter: ••••••••']),
          say(['p', '✓ '], ['o', 'permission granted. POST /email → 202 Accepted']),
          say(['o', 'next step: '], email),
        ],
      }),
    },
    coffee: { run: () => ({ lines: [out('☕ brewing… done. productivity +42%')] }) },
    'rm -rf /': { run: () => ({ lines: [out('rm: refusing: production is protected by RBAC ✋')] }) },
    exit: { run: () => ({ lines: [out('logout? this portfolio never sleeps. try `contact` instead.')] }) },
    clear: { about: 'clear the screen', run: () => ({ lines: [], effect: { clear: true } }) },
  };

  // single-word commands take an argument; multi-word ones match whole
  const names = Object.keys(COMMANDS);

  // own keys only, so `constructor` or `__proto__` are "not found", not crashes
  const lookup = (name: string): Command | undefined => (Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined);

  function run(input: string): CommandResult {
    const line = input.trim().replace(/\s+/g, ' ');
    if (!line) return { lines: [] };
    const exact = lookup(line) ?? lookup(line.toLowerCase());
    if (exact) return exact.run();
    const [head, ...rest] = line.split(' ');
    if (head === 'sudo') {
      return {
        lines: [out(`${rest.join(' ') || 'nam'}: nam is not in the sudoers file. This incident will be reported 🙂`)],
      };
    }
    if (head === 'echo') return { lines: [out(rest.join(' '))] };
    if (head === 'git') return run('git log');
    if (head === 'cat') {
      return rest.join(' ').toLowerCase().startsWith('readme')
        ? run('cat README.md')
        : { lines: [out(`cat: ${rest.join(' ')}: no such file`)] };
    }
    const command = lookup(head);
    if (command) return command.run(rest.join(' '));
    return { lines: [say(['o', `zsh: command not found: ${head} — try `], ['k', 'help'])] };
  }

  function complete(input: string): string {
    const pool = input.startsWith('cd ') ? targets.map((t) => `cd ${t}`) : names;
    const hits = pool.filter((n) => n.startsWith(input));
    if (!hits.length) return input;
    let prefix = hits[0];
    for (const h of hits) while (!h.startsWith(prefix)) prefix = prefix.slice(0, -1);
    return prefix.length > input.length ? prefix : input;
  }

  return { run, complete, names };
}
