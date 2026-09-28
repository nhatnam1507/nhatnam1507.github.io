// The identity box's token: every tick the IdP issues a fresh JWT
// (header.payload.signature) and the edge verifies its signature.
import { $ } from '../../../shared/dom.js';

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VERIFY_MS = 450;
const noise = (n) => Array.from({ length: n }, () => B64URL[(Math.random() * 64) | 0]).join('');

export function createIdentity(root) {
  const payload = $('.jwt-p', root);
  const signature = $('.jwt-s', root);
  const status = $('.js-jwt-ok', root);
  return {
    tick() {
      payload.textContent = `eyJzdWIi${noise(10)}`;
      signature.textContent = noise(10);
      status.textContent = '… verifying';
      status.classList.remove('is-ok');
      setTimeout(() => { status.textContent = '✓ verified'; status.classList.add('is-ok'); }, VERIFY_MS);
    },
  };
}
