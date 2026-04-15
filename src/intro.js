import chalk from 'chalk';
import { C, CLEAR, HIDE, SHOW } from './theme.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ASCII-art Claude "suiting up" animation. A few beats:
//   1. Empty stage.
//   2. Claude's emblem (✦) fades in.
//   3. Bowtie lands.
//   4. King's crown appears — Claude is ready.
// The animation lasts ~2.5 seconds and can be skipped with any key.

const EMBLEM = [
  '              ',
  '              ',
  '              ',
  '      ✦       ',
  '              ',
  '              ',
  '              ',
];

const BUST = [
  '              ',
  '    ╭────╮    ',
  '   ╱  ✦✦  ╲   ',
  '  │  ·  ·  │  ',
  '   ╲  ──  ╱   ',
  '    ╰────╯    ',
  '       ▽      ',
];

const BUST_BOWTIE = [
  '              ',
  '    ╭────╮    ',
  '   ╱  ✦✦  ╲   ',
  '  │  ·  ·  │  ',
  '   ╲  ──  ╱   ',
  '    ╰────╯    ',
  '     ◁▶◁▷     ',
];

const BUST_FULL = [
  '     ♔♔♔      ',
  '    ╭────╮    ',
  '   ╱  ✦✦  ╲   ',
  '  │  ·  ·  │  ',
  '   ╲  ──  ╱   ',
  '    ╰────╯    ',
  '     ◁▶◁▷     ',
];

const BANNER = [
  '  ╔══════════════════════════════════════════════════╗  ',
  '  ║                                                  ║  ',
  '  ║     c l a u d e   ·   c h e s s                  ║  ',
  '  ║                                                  ║  ',
  '  ╚══════════════════════════════════════════════════╝  ',
];

const colorize = (lines, fg) => lines.map((l) => chalk.hex(fg)(l));

function centered(cols, text) {
  const vis = text.replace(/\u001b\[[0-9;]*m/g, '');
  const pad = Math.max(0, Math.floor((cols - vis.length) / 2));
  return ' '.repeat(pad) + text;
}

function drawFrame(frame, caption, cols) {
  const out = [CLEAR, HIDE];
  const colored = frame.map((l) => chalk.hex(C.accent).bold(l));
  // Push about 1/4 down the screen.
  out.push('\n'.repeat(3));
  for (const l of colored) out.push(centered(cols, l) + '\n');
  out.push('\n');
  for (const l of colorize(BANNER, C.accentDim)) out.push(centered(cols, l) + '\n');
  out.push('\n');
  if (caption) out.push(centered(cols, chalk.hex(C.subtle)(caption)) + '\n');
  process.stdout.write(out.join(''));
}

export async function playIntro({ skippable = true } = {}) {
  const cols = process.stdout.columns || 80;

  const frames = [
    { art: EMBLEM,        caption: '',                          hold: 400 },
    { art: BUST,          caption: 'Claude enters the arena…',  hold: 500 },
    { art: BUST_BOWTIE,   caption: 'Claude puts on a bowtie…',  hold: 500 },
    { art: BUST_FULL,     caption: 'Claude is ready to play.',  hold: 700 },
  ];

  let skipped = false;
  const onKey = () => { skipped = true; };
  const stdin = process.stdin;
  const wasRaw = stdin.isRaw;
  if (stdin.isTTY && stdin.setRawMode) stdin.setRawMode(true);
  stdin.resume();
  stdin.on('data', onKey);

  try {
    for (const f of frames) {
      if (skipped) break;
      drawFrame(f.art, f.caption, cols);
      await sleep(f.hold);
    }
    if (!skipped) {
      drawFrame(BUST_FULL, 'press any key to continue…', cols);
      await new Promise((resolve) => {
        const done = () => resolve();
        stdin.once('data', done);
      });
    }
  } finally {
    stdin.off('data', onKey);
    if (stdin.isTTY && stdin.setRawMode) stdin.setRawMode(wasRaw ?? false);
  }
  process.stdout.write(CLEAR + SHOW);
}
