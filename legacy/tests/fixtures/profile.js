// A small, stable profile for unit tests, independent of the real CV so
// editing src/content/profile.js never breaks the domain tests.
export const fixtureProfile = () => ({
  name: 'Ada Example',
  title: 'Software Engineer',
  tagline: 'Backend · Cloud',
  location: 'Hanoi, Vietnam',
  careerStart: '2020-09-01',
  contact: { email: 'ada@example.com', phone: '+84 123 456 789', linkedin: 'linkedin.com/in/ada', github: 'github.com/ada' },
  summary: 'Builds reliable backend systems and the pipelines that ship them to production.',
  experience: [
    {
      role: 'Senior Engineer', company: 'Acme Cloud', location: 'Hanoi', start: 'Mar 2024', end: 'Present',
      bullets: ['Ran Kubernetes clusters on EKS.'], tags: ['Go', 'EKS'],
      label: 'Acme', highlight: 'Ran the platform team’s Kubernetes clusters.', impact: { value: '99.9%', label: 'uptime' },
    },
    {
      role: 'Engineer', company: 'Beta Soft Labs', project: 'Payments', location: 'Hanoi', start: 'Feb 2022', end: 'Feb 2024',
      bullets: ['Wrote Go services backed by PostgreSQL.'], tags: ['Go', 'PostgreSQL'],
      label: 'Payments', highlight: 'Go services for the payments platform.', impact: { value: '2x', label: 'throughput' },
    },
    {
      role: 'Engineer', company: 'Beta Soft Labs', project: 'Migration', location: 'Hanoi', start: 'Feb 2022', end: 'Aug 2022',
      bullets: ['Moved data without loss.'], tags: ['Python'],
      label: 'Migration', highlight: 'A zero-loss data migration project.', impact: { value: '0', label: 'records lost' },
    },
    {
      role: 'Junior Engineer', company: 'Gamma', location: 'Hanoi', start: 'Sep 2020', end: 'Jan 2022',
      bullets: ['Maintained a C/C++ server.'], tags: ['C/C++'],
      label: 'Gamma', highlight: 'Kept an industrial C++ server healthy.', impact: { value: '+20%', label: 'perf' },
    },
  ],
  education: [{ school: 'Example University', degree: 'BS Computer Science', start: 'Sep 2016', end: 'May 2020' }],
  certificates: [{ name: 'Cloud Cert', short: 'Cloud', issuer: 'Amazon Web Services', id: 'ABC123', date: 'May 27, 2023', badge: 'SAA' }],
  skills: { core: ['Go'], exploring: ['Rust'], groups: [{ label: 'languages', items: ['Go', 'C / C++'] }] },
});
