// Single source of truth for the portfolio page (index.html) and the
// printable CV template (cv.html). Edit here, then run `npm run pdf`
// to regenerate assets/cv/Nam_Nguyen_Nhat_CV.pdf.

export const cv = {
  name: 'Nam Nguyen Nhat',
  title: 'Senior Software Engineer',
  tagline: 'Backend · Cloud · DevOps',
  location: 'Ha Noi, Vietnam',
  careerStart: '2020-09-01',
  contact: {
    email: 'nhatnam.150798@gmail.com',
    phone: '0333921555',
    linkedin: 'linkedin.com/in/nhatnam1507',
    github: 'github.com/nhatnam1507',
  },
  summary:
    'A versatile, hardworking individual, driven to meet or exceed a company’s expectations and deliver high-quality software products. Experienced in backend development and deployment across the full software development life cycle. Offers a strong background in creative problem-solving and a proven ability to multi-task and prioritize in fast-paced, high-pressure environments.',

  experience: [
    {
      role: 'Senior Software Engineer',
      company: 'Andpad Vietnam',
      location: 'Hanoi, Vietnam',
      start: 'Mar 2026',
      end: 'Present',
      bullets: [
        'Built gRPC services enabling reliable, high-performance communication across internal microservices.',
        'Built a GraphQL API for the internal frontend team, simplifying data access and integration.',
        'Deployed to AWS (EC2/ECS/EKS, Lambda, S3/RDS) using GitHub Actions pipelines for smooth, reliable releases.',
        'Monitored production systems with Datadog and resolved issues to maintain system stability.',
      ],
      tags: ['gRPC', 'GraphQL', 'AWS', 'EKS', 'Lambda', 'GitHub Actions', 'Datadog'],
      // portfolio-only fields: timeline label, one-line story, headline metric
      label: 'Andpad',
      highlight: 'gRPC and GraphQL services on AWS (ECS/EKS, Lambda), shipped through GitHub Actions and watched with Datadog.',
      impact: { value: 'gRPC', label: 'service mesh between microservices' },
    },
    {
      role: 'Software Engineer',
      company: 'Rikkeisoft',
      project: 'Synapse ITS',
      location: 'Hanoi, Vietnam',
      start: 'May 2025',
      end: 'Feb 2026',
      bullets: [
        'Built a provider-agnostic OIDC authentication system, enabling single sign-on for enterprise clients across identity providers.',
        'Developed Go services to route data from a high-volume IoT device fleet into Google Cloud Pub/Sub.',
        'Developed Go parsers to decode IoT byte-stream data, improving processing accuracy and scalability.',
        'Developed unit tests with Go’s testing package and Testify, catching bugs early in development.',
        'Refactored existing tests and added new test cases, raising code coverage above 90% and improving test quality.',
      ],
      tags: ['Go', 'OIDC / SSO', 'GCP Pub/Sub', 'IoT', 'Testify'],
      label: 'Synapse ITS',
      highlight: 'Provider-agnostic OIDC single sign-on, plus Go pipelines decoding IoT byte streams into Google Pub/Sub.',
      impact: { value: '90%+', label: 'test coverage after refactor' },
    },
    {
      role: 'DevOps Engineer',
      company: 'Rikkeisoft',
      project: 'Data Dynamics',
      location: 'Hanoi, Vietnam',
      start: 'Nov 2023',
      end: 'May 2025',
      bullets: [
        'Built CI/CD pipelines across multiple projects, reducing manual deployment work.',
        'Established a standard Git branching strategy across teams.',
        'Built a platform installer with Ansible for consistent environment setup.',
        'Set up centralized logging and monitoring with the ELK stack, Grafana, and Prometheus for early issue detection.',
        'Built Kafka producers and consumers for real-time data exchange between microservices.',
        'Integrated Okta authentication into the REST API server to control access.',
        'Managed sprint planning and task delegation to keep delivery on schedule.',
      ],
      tags: ['CI/CD', 'Ansible', 'Kafka', 'ELK', 'Grafana', 'Prometheus', 'Okta'],
      label: 'Data Dynamics',
      highlight: 'CI/CD across projects, an Ansible platform installer, ELK + Grafana + Prometheus observability and Kafka messaging.',
      impact: { value: 'CI/CD', label: 'pipelines standardised across projects' },
    },
    {
      role: 'Software Engineer',
      company: 'Rikkeisoft',
      project: 'AllianceBernstein',
      location: 'Hanoi, Vietnam',
      start: 'Feb 2023',
      end: 'Sep 2024',
      bullets: [
        'Maintained the core application and resolved high-priority customer incidents to sustain uptime.',
        'Led the migration from SVN to Git across multiple teams.',
        'Migrated a legacy application from VMs to an AKS cluster (lift-and-shift), improving scalability.',
        'Built CI/CD pipelines for both the application and multiple MSSQL databases using Liquibase, automating deployment end to end.',
      ],
      tags: ['AKS', 'Kubernetes', 'Liquibase', 'MSSQL', 'Git'],
      label: 'AllianceBernstein',
      highlight: 'Led SVN → Git for multiple teams, lifted a legacy app from VMs to AKS and automated MSSQL releases with Liquibase.',
      impact: { value: 'VM→K8s', label: 'lift-and-shift to AKS' },
    },
    {
      role: 'Software Engineer',
      company: 'Rikkeisoft',
      project: 'Welby',
      location: 'Hanoi, Vietnam',
      start: 'Feb 2023',
      end: 'Aug 2023',
      bullets: [
        'Designed a database schema based on the FHIR standard to support data interoperability.',
        'Developed Go unit tests for the new schema to catch data issues early.',
        'Built custom Go migration tools to move data without loss.',
        'Built the repository layer for a Go API backed by PostgreSQL, enabling reliable data access.',
      ],
      tags: ['Go', 'PostgreSQL', 'FHIR', 'Data migration'],
      label: 'Welby',
      highlight: 'Designed a FHIR-based healthcare schema and wrote Go migration tools that moved the data without loss.',
      impact: { value: '0', label: 'records lost in migration' },
    },
    {
      role: 'Software Engineer',
      company: 'Toshiba Software Development',
      location: 'Hanoi, Vietnam',
      start: 'May 2022',
      end: 'Feb 2023',
      bullets: [
        'Improved the core OCR engine (C/C++) for better accuracy and performance.',
        'Built a Java (Spring) REST API layer on top of the OCR engine for use by other services.',
        'Built a proof-of-concept CI/CD pipeline deploying to AWS, demonstrating the value of automated deployments.',
      ],
      tags: ['C/C++', 'OCR', 'Java Spring', 'AWS'],
      label: 'OCR engine',
      highlight: 'Tuned a C/C++ OCR engine, exposed it through a Spring REST API and prototyped CI/CD to AWS.',
      impact: { value: 'C++→API', label: 'engine served as a REST service' },
    },
    {
      role: 'Software Engineer',
      company: 'Toshiba Software Development',
      location: 'Hanoi, Vietnam',
      start: 'Sep 2020',
      end: 'May 2022',
      bullets: [
        'Maintained a SCADA server system, ensuring reliable operation in an industrial environment.',
        'Improved processing performance by 20% using a C/C++ thread-pool multi-threading design.',
        'Developed unit test plans with GTest to validate system functionality.',
      ],
      tags: ['C/C++', 'SCADA', 'Multithreading', 'GTest'],
      label: 'SCADA',
      highlight: 'Kept an industrial SCADA server running reliably and sped it up with a C/C++ thread-pool redesign.',
      impact: { value: '+20%', label: 'processing performance' },
    },
  ],

  education: [
    {
      school: 'Hanoi University of Science and Technology',
      degree: 'BS in Automation Engineering Technology',
      start: 'Sep 2016',
      end: 'May 2020',
    },
  ],

  certificates: [
    {
      name: 'AWS Certified Solutions Architect – Associate',
      short: 'Solutions Architect',
      issuer: 'Amazon Web Services',
      id: 'EP2SK0FCW2QQQWWR',
      date: 'May 27, 2023',
      badge: 'SAA',
    },
    {
      name: 'AWS Certified Cloud Practitioner',
      short: 'Cloud Practitioner',
      issuer: 'Amazon Web Services',
      id: 'EJQ8R24KZBF110C9',
      date: 'Sep 24, 2022',
      badge: 'CCP',
    },
    {
      name: 'TOEIC',
      short: 'English proficiency',
      issuer: 'ETS',
      id: '810 / 990',
      date: 'Jan 2021 – Jan 2023',
      badge: '810',
    },
  ],

  skills: {
    core: ['Golang', 'PostgreSQL', 'Docker', 'Kubernetes (Helm)', 'CI/CD & Git'],
    exploring: ['Python', 'AI harness'],
    groups: [
      { label: 'languages', items: ['Go', 'C / C++', 'Java (Spring)', 'SQL', 'Python'] },
      { label: 'cloud', items: ['AWS', 'Google Cloud', 'Azure AKS'] },
      { label: 'infra', items: ['Docker', 'Kubernetes', 'Helm', 'Ansible'] },
      { label: 'apis', items: ['gRPC', 'GraphQL', 'REST', 'OIDC / Okta'] },
      { label: 'data', items: ['PostgreSQL', 'MSSQL', 'Kafka', 'Pub/Sub', 'Liquibase'] },
      { label: 'delivery', items: ['GitHub Actions', 'CI/CD', 'Git'] },
      { label: 'observability', items: ['Datadog', 'ELK', 'Grafana', 'Prometheus'] },
      { label: 'testing', items: ['Go testing', 'Testify', 'GTest'] },
    ],
  },
};

/** Whole years since careerStart, e.g. 6 */
export function yearsOfExperience(now = new Date()) {
  const start = new Date(cv.careerStart);
  return Math.floor((now - start) / (365.25 * 24 * 3600 * 1000));
}
