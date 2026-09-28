// The architecture diagram's configuration. Each tool is
// [name, level, pattern]; `pattern` is matched against the experience data
// to find which roles used it (see domain rolesUsing).

export const LEVELS = { core: 'core skill', used: 'in production', explore: 'currently exploring' };

export const BOXES = {
  api: {
    title: 'api edge', sub: 'exposed via',
    items: [['gRPC', 'used', /grpc/i], ['GraphQL', 'used', /graphql/i], ['REST', 'used', /\brest\b/i]],
  },
  idp: {
    title: 'identity', sub: 'provider',
    items: [['Okta', 'used', /okta/i], ['Keycloak', 'used', /keycloak/i], ['Google', 'used', /google(?! cloud)/i], ['Microsoft', 'used', /microsoft/i]],
  },
  svc: {
    title: 'services', sub: 'written in',
    items: [['Go', 'core', /\bgo\b/i], ['C / C++', 'used', /c\/c\+\+/i], ['Java · Spring', 'used', /java/i], ['Python', 'explore', /python/i]],
  },
  data: {
    title: 'data', sub: 'stored & streamed',
    items: [['PostgreSQL', 'core', /postgres/i], ['MSSQL', 'used', /mssql/i], ['Kafka', 'used', /kafka/i], ['Pub/Sub', 'used', /pub\/sub/i]],
  },
  obs: {
    title: 'observability', sub: 'watched by',
    items: [['Datadog', 'used', /datadog/i], ['Grafana', 'used', /grafana/i], ['Prometheus', 'used', /prometheus/i], ['ELK', 'used', /\belk\b/i]],
  },
  plat: {
    title: 'platform', sub: 'runs on',
    items: [['Docker', 'core', /docker/i], ['Kubernetes', 'core', /kubernetes|\baks\b|\beks\b/i], ['Helm', 'core', /helm/i], ['AWS', 'used', /\baws\b/i], ['Google Cloud', 'used', /google cloud|pub\/sub/i], ['Azure AKS', 'used', /\baks\b/i]],
  },
};

/** Delivery pipeline stages: [stage, tool, pattern] */
export const STAGES = [
  ['git push', 'Git', /\bgit\b|svn/i],
  ['build', 'GitHub Actions', /github actions|ci\/cd/i],
  ['test', 'Testify · GTest', /testify|gtest|unit test/i],
  ['migrate', 'Liquibase', /liquibase|migration/i],
  ['deploy', 'Ansible · Helm', /ansible|helm/i],
];

/** Wires between boxes: [id, from, to, kind] */
export const WIRES = [
  ['w-client-api', 'client', 'api', 'flow'],
  ['w-api-svc', 'api', 'svc', 'flow'],
  ['w-client-idp', 'client', 'idp', 'auth'],
  ['w-api-idp', 'api', 'idp', 'auth'],
  ['w-svc-data', 'svc', 'data', 'flow'],
  ['w-data-obs', 'data', 'obs', 'telemetry'],
  ['w-ci-svc', 'ci', 'svc', 'deploy'],
];

/** Caption for each build step while the system "deploys" on scroll. */
export const STEPS = [
  '$ make deploy',
  '$ kubectl apply -f platform/',
  '$ go build ./services/...',
  '$ migrate up · kafka topics created',
  '$ expose grpc · graphql · rest',
  '$ idp up: okta · keycloak · google · microsoft',
  '$ gh workflow run pipeline',
  '$ curl /healthz → 200 · all green ✓',
];

/** Resolve a `data-k` key ('svc:0', 'ci:2') to its tool definition. */
export function toolAt(key) {
  const [box, i] = key.split(':');
  if (box === 'ci') { const [stage, tool, pattern] = STAGES[+i]; return { name: `${stage} · ${tool}`, level: 'used', pattern }; }
  const [name, level, pattern] = BOXES[box].items[+i];
  return { name, level, pattern };
}
