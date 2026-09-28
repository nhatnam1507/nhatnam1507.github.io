// Delivery pipeline that runs stage by stage, passes, then starts a new run.
import { $, $$ } from '../../../shared/dom.js';

export function createPipeline(root, { firstRun = 1507 } = {}) {
  const stages = $$('.ci-stage', root);
  const status = $('.js-ci-status', root);
  const runEl = $('.js-ci-run', root);
  const n = stages.length;
  let run = firstRun, stage = -1;

  const setStatus = (text, s) => { status.textContent = text; status.dataset.s = s; };

  return {
    tick() {
      stage++;
      if (stage === 0) { stages.forEach((s) => s.classList.remove('is-run', 'is-ok')); runEl.textContent = `#${run++}`; }
      if (stage > 0 && stage <= n) stages[stage - 1].classList.replace('is-run', 'is-ok');
      if (stage < n) { stages[stage].classList.add('is-run'); setStatus(`running ${stage + 1}/${n}`, 'run'); }
      else if (stage === n) setStatus('passed ✓', 'ok');
      else if (stage > n + 2) stage = -1; // idle for a beat, then rerun
    },
  };
}
