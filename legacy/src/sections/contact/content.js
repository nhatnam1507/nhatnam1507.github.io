// Contact rendered as an API: each channel is an endpoint, and the terminal
// "pings" Nam before POSTing an idea.

/** profile.contact → endpoint rows: [method, path, value, href, status] */
export const endpoints = ({ email, linkedin, github }) => [
  { method: 'POST', path: '/email', value: email, href: `mailto:${email}`, status: '202 · ~1d', copy: true },
  { method: 'GET', path: '/linkedin', value: linkedin, href: `https://www.${linkedin}`, status: '200 OK' },
  { method: 'GET', path: '/github', value: github, href: `https://${github}`, status: '200 OK' },
];

/** The session typed into the contact terminal. */
export const handshake = ({ location }) => [
  { p: '$ ', t: 'ping nam' },
  { o: `PING nam (${location} · UTC+7): reply time < 1 day` },
  { p: '$ ', t: `curl -X POST /collab -d '{"idea":"yours"}'` },
  { o: 'HTTP/1.1 202 Accepted — let’s talk ✉' },
];

/** Hour in Hanoi → what Nam is probably doing (and so how fast a reply is). */
export function presence(hour) {
  if (hour < 7) return { icon: '💤', text: 'asleep · replies after coffee' };
  if (hour < 9) return { icon: '☕', text: 'brewing coffee' };
  if (hour < 12) return { icon: '⌨', text: 'in focus mode' };
  if (hour < 13) return { icon: '🍜', text: 'lunch break' };
  if (hour < 18) return { icon: '🚀', text: 'shipping' };
  if (hour < 23) return { icon: '🌙', text: 'off hours · still reads mail' };
  return { icon: '💤', text: 'asleep · replies after coffee' };
}
