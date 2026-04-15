import chalk from 'chalk';
import { C, EMBLEM } from './theme.js';

// A Claude-Code-flavoured "thinking" animation. A bar of slots — all dots
// except for one sparkle that glides across, reverses, and comes back.
// Rendered as a single line that can be dropped wherever.

const SLOTS = 5;

export function createShimmer() {
  let tick = 0;
  return {
    tick: () => ++tick,
    frame: () => renderFrame(tick),
  };
}

function renderFrame(tick) {
  // Period = 2*(SLOTS-1) so the sparkle travels out and back.
  const period = (SLOTS - 1) * 2;
  const pos = tick % period;
  const idx = pos < SLOTS ? pos : period - pos;
  const cells = [];
  for (let i = 0; i < SLOTS; i++) {
    if (i === idx) {
      cells.push(chalk.hex(C.accent).bold(EMBLEM));
    } else {
      const dist = Math.abs(i - idx);
      const dim = dist === 1 ? C.accentDim : C.muted;
      cells.push(chalk.hex(dim)('·'));
    }
  }
  return cells.join(' ');
}

// Drive a render callback at ~90ms cadence until `stop()` is called.
// The callback receives the current frame string and should redraw. We
// don't own the screen, so we never clear — the caller decides where to
// paint the spinner.
export function runShimmer(onFrame) {
  const shimmer = createShimmer();
  onFrame(shimmer.frame());
  const handle = setInterval(() => {
    shimmer.tick();
    onFrame(shimmer.frame());
  }, 90);
  return () => clearInterval(handle);
}
