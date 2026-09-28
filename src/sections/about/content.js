// Section copy for the dashboard. Presentation-specific (the jokes live
// here, not in the CV data), but derived numbers come from the context.

/** Headline SLIs across the top of the dashboard. */
export const slis = ({ profile, stats }) => [
  { to: 90, suffix: '%', label: 'test coverage', note: 'go test · testify' },
  { prefix: '+', to: 20, suffix: '%', label: 'SCADA throughput', note: 'C++ thread pool' },
  { to: profile.certificates.filter((c) => c.issuer.startsWith('Amazon')).length, suffix: '×', label: 'AWS certified', note: 'SAA · CCP' },
  { to: stats.roles, label: 'roles shipped', note: `${stats.employers} companies` },
];

export const readmeTokens = ({ stats }) => [
  ['h', '# nam.nguyen\n'],
  ['m', 'backend · cloud · devops @ hanoi\n'],
  ['m', `${stats.years} yrs: C++ SCADA → Go on k8s\n\n`],
  ['b', '- '], ['', 'turns YAML into production\n'],
  ['b', '- '], ['', 'every alert must be actionable\n'],
  ['b', '- '], ['', 'friday deploys: '], ['r', 'strongly no\n'],
  ['b', '- '], ['', 'debugs with logs, not vibes'],
];

// PIDs are well-known ports, for the people who notice
export const PROCESSES = [
  { pid: 8080, cmd: 'go build ./ideas/...', cpu: 34 },
  { pid: 6443, cmd: 'kubectl get pods -w', cpu: 22 },
  { pid: 3306, cmd: 'coffee.service', cpu: 17 },
  { pid: 5432, cmd: 'read --the-docs', cpu: 12 },
  { pid: 9090, cmd: 'rubber-duck --verbose', cpu: 9 },
  { pid: 666, cmd: 'deploy-on-friday.sh', cpu: 0, killed: true },
];

export const LOG_LINES = [
  ['INFO', 'coffee.service started (cups=1)'],
  ['INFO', 'go test ./... PASS · coverage=90.3%'],
  ['WARN', '"works on my machine" detected → writing Dockerfile'],
  ['INFO', 'deployment/api successfully rolled out'],
  ['DEBUG', 'rubber duck consulted · root cause in 4m'],
  ['ERROR', 'deploy-on-friday.sh blocked by nam (SIGKILL)'],
  ['INFO', 'PR merged with 0 comments… suspicious'],
  ['INFO', 'alert fired → actionable ✓ → resolved'],
  ['WARN', '47 browser tabs open (3 are docs)'],
  ['INFO', 'helm diff: no surprises. phew.'],
  ['DEBUG', 'grpc: p99 latency happy'],
  ['INFO', 'git push --force-with-lease (responsibly)'],
];

/** Hourly 08h → 20h. Coffee is cumulative cups, bugs are open bugs. */
export const DAY = {
  startHour: 8,
  coffee: [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4],
  bugs: [9, 8, 6, 6, 5, 6, 4, 3, 3, 2, 1, 1, 0],
  note: { at: 5, text: 'lunch → bug +1' },
};

export const TIME_ZONE = 'Asia/Ho_Chi_Minh';
