// The architecture diagram's configuration. Each tool is
// [name, level, pattern]; `pattern` is matched against the experience data
// to find which roles used it (see domain rolesUsing).

export const LEVELS = { core: 'core skill', used: 'in production', explore: 'currently exploring' } as const;
export type Level = keyof typeof LEVELS;

export type ToolDef = readonly [name: string, level: Level, pattern: RegExp];

interface BoxDef {
  title: string;
  sub: string;
  items: readonly ToolDef[];
}

export const BOXES = {
  api: {
    title: 'api edge',
    sub: 'exposed via',
    items: [
      ['gRPC', 'used', /grpc/i],
      ['GraphQL', 'used', /graphql/i],
      ['REST', 'used', /\brest\b/i],
    ],
  },
  idp: {
    title: 'identity',
    sub: 'provider',
    items: [
      ['Okta', 'used', /okta/i],
      ['Keycloak', 'used', /keycloak/i],
      ['Google', 'used', /google(?! cloud)/i],
      ['Microsoft', 'used', /microsoft/i],
    ],
  },
  svc: {
    title: 'services',
    sub: 'written in',
    items: [
      ['Go', 'core', /\bgo\b/i],
      ['C / C++', 'used', /c\/c\+\+/i],
      ['Java · Spring', 'used', /java/i],
      ['Python', 'explore', /python/i],
    ],
  },
  data: {
    title: 'data',
    sub: 'stored & streamed',
    items: [
      ['PostgreSQL', 'core', /postgres/i],
      ['MSSQL', 'used', /mssql/i],
      ['Kafka', 'used', /kafka/i],
      ['Pub/Sub', 'used', /pub\/sub/i],
    ],
  },
  obs: {
    title: 'observability',
    sub: 'watched by',
    items: [
      ['Datadog', 'used', /datadog/i],
      ['Grafana', 'used', /grafana/i],
      ['Prometheus', 'used', /prometheus/i],
      ['ELK', 'used', /\belk\b/i],
    ],
  },
  plat: {
    title: 'platform',
    sub: 'runs on',
    items: [
      ['Docker', 'core', /docker/i],
      ['Kubernetes', 'core', /kubernetes|\baks\b|\beks\b/i],
      ['Helm', 'core', /helm/i],
      ['AWS', 'used', /\baws\b/i],
      ['Google Cloud', 'used', /google cloud|pub\/sub/i],
      ['Azure AKS', 'used', /\baks\b/i],
    ],
  },
} as const satisfies Record<string, BoxDef>;
export type BoxId = keyof typeof BOXES;

/** The boxes built from BOXES, in page (DOM) order. */
export const BOX_ORDER = ['api', 'idp', 'svc', 'data', 'obs', 'plat'] as const satisfies readonly BoxId[];

/** Every diagram box a wire can attach to (`data-box`): the BOXES plus the two hand-built ones. */
export type NodeId = BoxId | 'ci' | 'client';

/** Delivery pipeline stages: [stage, tool, pattern] */
export const STAGES = [
  ['git push', 'Git', /\bgit\b|svn/i],
  ['build', 'GitHub Actions', /github actions|ci\/cd/i],
  ['test', 'Testify · GTest', /testify|gtest|unit test/i],
  ['migrate', 'Liquibase', /liquibase|migration/i],
  ['deploy', 'Ansible · Helm', /ansible|helm/i],
] as const satisfies readonly (readonly [stage: string, tool: string, pattern: RegExp])[];

export type WireKind = 'flow' | 'auth' | 'telemetry' | 'deploy';

/** Wires between boxes: [id, from, to, kind] */
export const WIRES = [
  ['w-client-api', 'client', 'api', 'flow'],
  ['w-api-svc', 'api', 'svc', 'flow'],
  ['w-client-idp', 'client', 'idp', 'auth'],
  ['w-api-idp', 'api', 'idp', 'auth'],
  ['w-svc-data', 'svc', 'data', 'flow'],
  ['w-data-obs', 'data', 'obs', 'telemetry'],
  ['w-ci-svc', 'ci', 'svc', 'deploy'],
] as const satisfies readonly (readonly [id: string, from: NodeId, to: NodeId, kind: WireKind])[];
export type Wire = (typeof WIRES)[number];

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
] as const;

export interface Tool {
  name: string;
  level: Level;
  pattern: RegExp;
}

/** Resolve a `data-k` key ('svc:0', 'ci:2') to its tool definition. */
export function toolAt(key: string): Tool {
  const [box = '', index = ''] = key.split(':');
  const i = /^\d+$/.test(index) ? Number(index) : -1;
  if (box === 'ci') {
    const stage = STAGES[i];
    if (!stage) throw new Error(`Unknown pipeline stage "${key}"`);
    const [name, tool, pattern] = stage;
    return { name: `${name} · ${tool}`, level: 'used', pattern };
  }
  const def = Object.hasOwn(BOXES, box) ? (BOXES as Record<string, BoxDef>)[box] : undefined;
  const item = def?.items[i];
  if (!item) throw new Error(`Unknown tool "${key}"`);
  const [name, level, pattern] = item;
  return { name, level, pattern };
}
