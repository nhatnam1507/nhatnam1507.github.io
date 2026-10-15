// In-page jumps (the nav itself is rendered by chrome/Nav).
//
// Jumps don't smooth-scroll through every pinned/scrubbed section in between
// (that replays all of them at once and stutters): a curtain wipes in, the
// page jumps underneath it, the 3D scene snaps, and the curtain wipes out.
import { gsap, ScrollTrigger, type Lenis } from '@/shared/lib';
import { $req } from '@/shared/dom';
import { scrollRange } from '@/shared/motion';
import type { SceneHandle, SectionId } from '../contract';
import { onAbort } from '@/shared/abort';

export interface JumpOptions {
  lenis: Lenis | null;
  scene: SceneHandle | null;
  reducedMotion: boolean;
  signal: AbortSignal;
}

/** The command typed on the curtain: `cd ~/about`, or `cd ~/` for the hero. */
const curtainCommand = (id: string): string => `cd ~/${id === 'hero' ? '' : id}`;

/** Wires `[data-scroll-to]` links and returns the same jump as a service. */
export function attachJumps({ lenis, scene, reducedMotion, signal }: JumpOptions): { navigate(id: SectionId): void } {
  const curtain = $req('.curtain');
  const cmd = $req('.curtain-cmd');
  let busy = false;
  let wipe: gsap.core.Timeline | undefined;

  const jump = (target: HTMLElement) => {
    const y = scrollRange(target).getBoundingClientRect().top + scrollY; // pin start for pinned sections
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    ScrollTrigger.update();
    scene?.snap();
  };

  // the one jump: nav links and `navigate()` both go through here
  const go = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    if (reducedMotion) {
      jump(target);
      return;
    }
    if (busy) return;
    busy = true;
    cmd.textContent = curtainCommand(id);
    wipe = gsap
      .timeline({
        onComplete: () => {
          busy = false;
        },
      })
      .set(curtain, { visibility: 'visible', yPercent: 100 })
      .to(curtain, { yPercent: 0, duration: 0.38, ease: 'power3.in' })
      .call(() => jump(target))
      .to(curtain, { yPercent: -100, duration: 0.5, ease: 'power3.out', delay: 0.14 })
      .set(curtain, { visibility: 'hidden' });
  };

  document.addEventListener(
    'click',
    (e) => {
      const link = e.target instanceof Element ? e.target.closest('[data-scroll-to]') : null;
      const id = link?.getAttribute('href')?.replace(/^#/, '');
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      go(id);
    },
    { signal },
  );

  // the timeline starts from a click, outside the runtime's gsap.context
  onAbort(signal, () => {
    wipe?.revert();
    busy = false;
  });

  return { navigate: go };
}
