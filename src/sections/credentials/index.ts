// STUB (S0): replaced by the slice that ports legacy/src/sections/credentials/.
import { defineSection } from '@/shell/contract';
import { CredentialsView } from './View';

export default defineSection({
  id: 'credentials',
  kind: 'section',
  label: 'certs',
  shape: 'knot',
  View: CredentialsView,
});
