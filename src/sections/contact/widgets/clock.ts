// The live Hanoi clock and the "what is Nam doing right now" line.
import { $req } from '@/shared/dom';
import { formatClock, hourIn } from '@/shared/time';
import { presence } from '../content';

/** Fills the placeholders the View renders. Returns the tick to run every second. */
export function createPresenceClock(root: HTMLElement): () => void {
  const local = $req('.js-local', root);
  const moodIcon = $req('.js-mood-i', root);
  const mood = $req('.js-mood', root);
  let hour = -1;
  return () => {
    const now = new Date();
    local.textContent = formatClock(now);
    const h = hourIn(now);
    if (h === hour) return; // the presence line only changes with the hour
    hour = h;
    const p = presence(h);
    moodIcon.textContent = p.icon;
    mood.textContent = p.text;
  };
}
