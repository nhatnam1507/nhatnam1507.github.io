// The identity box's token: every tick the IdP issues a fresh JWT
// (header.payload.signature) and the edge verifies its signature.
import { $req } from '@/shared/dom';
import { settleLater } from './settle';

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VERIFY_MS = 450;
const noise = (n: number): string =>
  Array.from({ length: n }, () => B64URL[Math.floor(Math.random() * B64URL.length)]).join('');

export function createIdentity(root: HTMLElement, signal: AbortSignal) {
  const payload = $req('.jwt-p', root);
  const signature = $req('.jwt-s', root);
  const status = $req('.js-jwt-ok', root);
  return {
    tick(): void {
      payload.textContent = `eyJzdWIi${noise(10)}`;
      signature.textContent = noise(10);
      status.textContent = '… verifying';
      status.classList.remove('is-ok');
      settleLater(
        signal,
        () => {
          status.textContent = '✓ verified';
          status.classList.add('is-ok');
        },
        VERIFY_MS,
      );
    },
  };
}
