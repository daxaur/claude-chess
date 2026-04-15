import chalk from 'chalk';
import { C, EMBLEM, CLEAR, HIDE, SHOW, spaced } from './theme.js';
import { createInput } from './input.js';
import { formatWhen, formatResult } from './persistence.js';

// Centered helpers — every menu screen shares the same vertical rhythm.
const centered = (cols, s) => {
  const visible = s.replace(/\u001b\[[0-9;]*m/g, '').length;
  const pad = Math.max(0, Math.floor((cols - visible) / 2));
  return ' '.repeat(pad) + s;
};

function drawHeader(cols, lines) {
  lines.push('');
  lines.push(centered(cols, chalk.hex(C.accent).bold(
    `${EMBLEM}   ` + spaced('claude · chess') + `   ${EMBLEM}`
  )));
  lines.push(centered(cols, chalk.hex(C.muted)('terminal chess against Claude')));
  lines.push('');
}

// Renders { label, hint?, disabled? } options vertically centered.
export function drawOptions(cols, items, selectedIdx) {
  const out = [];
  const width = Math.max(
    ...items.map(
      (it) => it.label.length + (it.hint ? ('  ' + it.hint).length : 0)
    )
  );
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const isSel = i === selectedIdx;
    const arrow = isSel ? chalk.hex(C.accent).bold('▶ ') : '  ';
    const label = isSel
      ? chalk.hex(C.accent).bold(it.label)
      : (it.disabled
        ? chalk.hex(C.muted)(it.label)
        : chalk.hex(C.text)(it.label));
    const hint = it.hint
      ? chalk.hex(C.subtle)('  ' + it.hint)
      : '';
    const padSpace = Math.max(0, width - it.label.length - (it.hint ? 0 : 0));
    const body = (arrow + label + hint).padEnd(width + 6);
    out.push(centered(cols, body));
  }
  return out;
}

export async function mainMenu(store) {
  const cols = process.stdout.columns || 80;

  while (true) {
    const ongoing = store.mostRecentOngoing();
    const all = store.list();

    const items = [
      { kind: 'new',      label: 'New game', hint: 'choose difficulty and start fresh' },
    ];
    if (ongoing) {
      const diff = ongoing.difficulty;
      const when = formatWhen(ongoing.updatedAt);
      items.push({
        kind: 'continue',
        label: 'Continue',
        hint: `Lv.${diff} · ${ongoing.moveCount} moves · ${when}`,
        record: ongoing,
      });
    } else {
      items.push({ kind: 'continue', label: 'Continue', hint: 'no games in progress', disabled: true });
    }
    items.push({
      kind: 'library',
      label: 'Library',
      hint: all.length > 0 ? `${all.length} saved ${all.length === 1 ? 'game' : 'games'}` : 'empty',
      disabled: all.length === 0,
    });
    items.push({ kind: 'quit', label: 'Quit', hint: '' });

    // Default to "Continue" when there's an ongoing game, else "New".
    let idx = ongoing ? 1 : 0;
    const firstEnabled = items.findIndex((it) => !it.disabled);

    const draw = () => {
      const lines = [CLEAR, HIDE];
      const rows = [];
      drawHeader(cols, rows);
      for (const r of drawOptions(cols, items, idx)) rows.push(r);
      rows.push('');
      rows.push(centered(cols,
        chalk.hex(C.muted)('↑ ↓  choose   ·   ↵  select   ·   q  quit')
      ));

      // Push it into roughly the middle third of the screen.
      const top = Math.max(2, Math.floor(((process.stdout.rows || 30) - rows.length) / 2));
      lines.push('\n'.repeat(top));
      for (const r of rows) lines.push(r + '\n');
      process.stdout.write(lines.join(''));
    };
    draw();

    const action = await new Promise((resolve) => {
      const input = createInput();
      const step = (dir) => {
        for (let i = 0; i < items.length; i++) {
          idx = (idx + dir + items.length) % items.length;
          if (!items[idx].disabled) break;
        }
        draw();
      };
      input.on((key) => {
        if (key.name === 'up')   step(-1);
        if (key.name === 'down') step( 1);
        if (key.name === 'q' || key.name === 'ctrl-c' || key.name === 'esc') {
          input.close();
          resolve({ kind: 'quit' });
        }
        if (key.name === 'enter' || key.name === 'space') {
          if (items[idx].disabled) {
            // Fall back to the first enabled row so Enter always does
            // something sensible.
            if (firstEnabled !== -1) idx = firstEnabled;
            draw();
            return;
          }
          input.close();
          const chosen = items[idx];
          resolve({ kind: chosen.kind, record: chosen.record });
        }
      });
    });

    process.stdout.write(CLEAR + SHOW);
    return action;
  }
}
