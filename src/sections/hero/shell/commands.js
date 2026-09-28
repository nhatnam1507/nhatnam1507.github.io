// The hero terminal's commands. Pure: a command line in, output lines and an
// optional side effect out, so it runs under `node --test` with no DOM.
//
// A line is a list of tokens: [class, text] or ['a', text, href].
// An effect is { goto: sectionId } | { export: true } | { clear: true }.
import { tenure } from '../../../domain/career.js';
import { shortHash } from '../../../shared/random.js';

const out = (text) => [['o', text]];
const say = (...tokens) => tokens;

/**
 * @param {object} deps
 * @param {object} deps.profile
 * @param {object[]} deps.roles   domain Role[] (oldest first)
 * @param {object} deps.stats     careerStats
 * @param {string[]} deps.targets section ids you can `cd` into
 * @param {() => string} deps.clock current time in Hanoi, 'HH:MM:SS'
 */
export function createCommands({ profile, roles, stats, targets, clock }) {
  const { contact } = profile;
  const email = ['a', contact.email, `mailto:${contact.email}`];

  const COMMANDS = {
    help: {
      about: 'list commands',
      run: () => ({
        lines: [
          out('available commands:'),
          ...Object.entries(COMMANDS).filter(([, c]) => c.about).map(([name, c]) => say(['k', name.padEnd(14)], ['c', c.about])),
          say(['c', 'tab completes · ↑/↓ history · ctrl+l clears']),
        ],
      }),
    },
    whoami: {
      about: 'who is this',
      run: () => ({ lines: [out(`${profile.name} — ${profile.title} · ${profile.tagline}`), out(`based in ${profile.location} (UTC+7)`)] }),
    },
    uptime: {
      about: 'career uptime',
      run: () => ({ lines: [out(`up ${stats.years} years · ${stats.employers} companies · ${stats.roles} roles · load average: ☕ ☕ ☕`)] }),
    },
    'git log': {
      about: 'career history',
      run: () => ({
        lines: [...roles].reverse().map((r) => say(
          ['s', shortHash(`${r.company}${r.label}${r.startLabel}`)],
          ['o', ' '],
          ['k', `(${r.label})`],
          ['o', ` ${r.role} · ${r.startLabel} → ${r.endLabel} `],
          ['c', `[${tenure(r.months)}]`],
        )),
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
      run: () => ({ lines: [say(...targets.map((t) => ['k', `${t}/  `]), ['o', 'README.md  cv.pdf'])] }),
    },
    cd: {
      about: 'jump to a section',
      usage: 'cd <section>',
      run: (arg) => {
        const to = (arg || '').replace(/^[~./]+|\/+$/g, '');
        if (!to) return { lines: [out(`usage: cd <section> — one of ${targets.join(', ')}`)] };
        if (!targets.includes(to)) return { lines: [out(`cd: no such section: ${to}`)] };
        return { lines: [say(['c', `→ ~/${to}`])], effect: { goto: to } };
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

  /** Run one command line. */
  function run(input) {
    const line = input.trim().replace(/\s+/g, ' ');
    if (!line) return { lines: [] };
    const exact = COMMANDS[line] || COMMANDS[line.toLowerCase()];
    if (exact) return exact.run();
    const [head, ...rest] = line.split(' ');
    if (head === 'sudo') return { lines: [out(`${rest.join(' ') || 'nam'}: nam is not in the sudoers file. This incident will be reported 🙂`)] };
    if (head === 'echo') return { lines: [out(rest.join(' '))] };
    if (head === 'git') return COMMANDS['git log'].run();
    if (head === 'cat') return rest.join(' ').toLowerCase().startsWith('readme') ? COMMANDS['cat README.md'].run() : { lines: [out(`cat: ${rest.join(' ')}: no such file`)] };
    if (COMMANDS[head]) return COMMANDS[head].run(rest.join(' '));
    return { lines: [say(['o', `zsh: command not found: ${head} — try `], ['k', 'help'])] };
  }

  /** Tab completion: the longest unambiguous completion of `input`, or itself. */
  function complete(input) {
    const pool = input.startsWith('cd ') ? targets.map((t) => `cd ${t}`) : names;
    const hits = pool.filter((n) => n.startsWith(input));
    if (!hits.length) return input;
    let prefix = hits[0];
    for (const h of hits) while (!h.startsWith(prefix)) prefix = prefix.slice(0, -1);
    return prefix.length > input.length ? prefix : input;
  }

  return { run, complete, names };
}
