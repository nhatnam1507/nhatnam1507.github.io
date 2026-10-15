// 04 // credentials — certificate cards that verify themselves as they enter,
// then education and career drawn on one time axis. Markup: View.tsx;
// animation: behaviour.ts.
import { defineSection } from '@/shell/contract';
import { CredentialsView } from './View';

export default defineSection({
  id: 'credentials',
  kind: 'section',
  label: 'certs',
  shape: 'knot',
  View: CredentialsView,
});
