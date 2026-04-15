import chalk from 'chalk';
import { C, EMBLEM, CLEAR, HIDE, SHOW, spaced, DIFFICULTIES } from './theme.js';
import { createInput } from './input.js';

const centered = (cols, s) => {
  const vis = s.replace(/\u001b\[[0-9;]*m/g, '').length;
  return ' '.repeat(Math.max(0, Math.floor((cols - vis) / 2))) + s;
};

// Returns a UI difficulty (1..5) or null if cancelled.
export async function selectDifficulty(defaultLevel = 3) {
  const cols = process.stdout.columns || 80;
  let idx = Math.min(Math.max(defaultLevel - 1, 0), DIFFICULTIES.length - 1);

  const draw = () => {
    const lines = [CLEAR, HIDE];
    lines.push('\n\n');
    lines.push(centered(cols, chalk.hex(C.accent).bold(
      EMBLEM + '   ' + spaced('choose your opponent') + '   ' + EMBLEM
    )) + '\n\n');

    const widestLabel = Math.max(...DIFFICULTIES.map((d) => d.label.length));
    for (let i = 0; i < DIFFICULTIES.length; i++) {
      const d = DIFFICULTIES[i];
      const sel = i === idx;
      const arrow = sel ? chalk.hex(C.accent).bold('▶ ') : '  ';
      const level = sel
        ? chalk.hex(C.accent).bold(`Lv.${i + 1}`)
        : chalk.hex(C.subtle)(`Lv.${i + 1}`);
      const label = sel
        ? chalk.hex(C.text).bold(d.label.padEnd(widestLabel + 2))
        : chalk.hex(C.text)(d.label.padEnd(widestLabel + 2));
      const hint = chalk.hex(C.muted)(d.hint);
      lines.push(centered(cols, `${arrow}${level}  ${label}${hint}`) + '\n');
    }
    lines.push('\n');
    lines.push(centered(cols, chalk.hex(C.muted)(
      '↑ ↓  choose   ·   1–5  jump   ·   ↵  start   ·   esc  back'
    )) + '\n');
    process.stdout.write(lines.join(''));
  };
  draw();

  return new Promise((resolve) => {
    const input = createInput();
    input.on((key) => {
      if (key.name === 'up')   { idx = (idx - 1 + DIFFICULTIES.length) % DIFFICULTIES.length; draw(); }
      if (key.name === 'down') { idx = (idx + 1) % DIFFICULTIES.length; draw(); }
      if (/^[1-5]$/.test(key.char || '')) { idx = parseInt(key.char, 10) - 1; draw(); }
      if (key.name === 'enter' || key.name === 'space') {
        input.close();
        process.stdout.write(CLEAR + SHOW);
        resolve(idx + 1);
      }
      if (key.name === 'esc' || key.name === 'q' || key.name === 'ctrl-c') {
        input.close();
        process.stdout.write(CLEAR + SHOW);
        resolve(null);
      }
    });
  });
}
