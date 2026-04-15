import chalk from 'chalk';
import { C, CLEAR, HIDE, SHOW } from './theme.js';
import { DIFFICULTIES } from './theme.js';
import { createInput } from './input.js';

const centered = (cols, s) => {
  const vis = s.replace(/\u001b\[[0-9;]*m/g, '');
  const pad = Math.max(0, Math.floor((cols - vis.length) / 2));
  return ' '.repeat(pad) + s;
};

export async function selectDifficulty(defaultLevel = 3) {
  const cols = process.stdout.columns || 80;
  let idx = Math.min(Math.max(defaultLevel - 1, 0), DIFFICULTIES.length - 1);

  const render = () => {
    const out = [CLEAR, HIDE];
    out.push('\n\n');
    out.push(centered(cols, chalk.hex(C.accent).bold('choose your opponent')) + '\n\n');

    for (let i = 0; i < DIFFICULTIES.length; i++) {
      const d = DIFFICULTIES[i];
      const active = i === idx;
      const arrow = active ? chalk.hex(C.accent).bold('▶ ') : '  ';
      const label = active
        ? chalk.hex(C.accent).bold(`Lv.${i + 1}  ${d.label.padEnd(12)}`)
        : chalk.hex(C.text)(`Lv.${i + 1}  ${d.label.padEnd(12)}`);
      const hint = chalk.hex(C.subtle)(d.hint);
      out.push(centered(cols, `${arrow}${label}  ${hint}`) + '\n');
    }
    out.push('\n');
    out.push(
      centered(
        cols,
        chalk.hex(C.subtle)('↑ ↓ choose   ·   ↵ start   ·   q quit')
      ) + '\n'
    );
    process.stdout.write(out.join(''));
  };

  render();

  const input = createInput();
  return new Promise((resolve) => {
    input.on((key) => {
      if (key.name === 'up')   { idx = (idx - 1 + DIFFICULTIES.length) % DIFFICULTIES.length; render(); }
      if (key.name === 'down') { idx = (idx + 1) % DIFFICULTIES.length; render(); }
      if (/^[1-5]$/.test(key.char || '')) { idx = parseInt(key.char, 10) - 1; render(); }
      if (key.name === 'enter' || key.name === 'space') {
        input.close();
        process.stdout.write(CLEAR + SHOW);
        resolve(idx + 1);
      }
      if (key.name === 'q' || key.name === 'ctrl-c' || key.name === 'esc') {
        input.close();
        process.stdout.write(CLEAR + SHOW);
        resolve(null);
      }
    });
  });
}
