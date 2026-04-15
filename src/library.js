import chalk from 'chalk';
import { Chess } from 'chess.js';
import { C, EMBLEM, CLEAR, HIDE, SHOW, spaced, divider } from './theme.js';
import { createInput } from './input.js';
import { DIFFICULTIES } from './theme.js';
import { formatWhen, formatResult } from './persistence.js';

const centered = (cols, s) => {
  const vis = s.replace(/\u001b\[[0-9;]*m/g, '').length;
  return ' '.repeat(Math.max(0, Math.floor((cols - vis) / 2))) + s;
};

// Compact ASCII render of a board position — used as a preview in the
// right-hand pane of the library. Two characters per square (piece + space),
// 8 wide, 8 tall. Colours are muted so the preview reads as secondary.
function renderMiniBoard(fen) {
  const chess = new Chess(fen);
  const board = chess.board();
  const lines = [];
  for (let r = 0; r < 8; r++) {
    let line = '';
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      const isLight = (r + f) % 2 === 0;
      const ch = sq
        ? (sq.color === 'w' ? pieceLight(sq.type) : pieceDark(sq.type))
        : (isLight ? '·' : ' ');
      const fg = sq
        ? (sq.color === 'w' ? C.whitePiece : C.accent)
        : C.muted;
      line += chalk.hex(fg)(ch) + ' ';
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
const pieceLight = (t) => ({ p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' }[t]);
const pieceDark  = (t) => ({ p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }[t]);

// Single-row rendering for a game in the list. All columns are padded to
// fixed widths so rows align without any box-drawing.
function formatRow(rec, selected) {
  const diff = DIFFICULTIES[rec.difficulty - 1];
  const when = formatWhen(rec.updatedAt).padEnd(10);
  const level = `Lv.${rec.difficulty} ${diff.label}`.padEnd(18);
  const moves = `${rec.moveCount} mvs`.padEnd(8);
  const result = formatResult(rec.result).padEnd(14);
  const line = `${when}  ${level}  ${moves}  ${result}`;
  if (selected) return chalk.hex(C.accent).bold('▶ ' + line);
  const fg = rec.result === 'playing' ? C.text : C.subtle;
  return '  ' + chalk.hex(fg)(line);
}

// Ask the user to confirm deletion. Returns true/false.
async function confirmDelete(cols, rec) {
  const lines = [CLEAR, HIDE];
  lines.push('\n\n\n');
  lines.push(centered(cols, chalk.hex(C.danger).bold('Delete this game?')) + '\n\n');
  lines.push(centered(cols,
    chalk.hex(C.subtle)(`game ${rec.id} · ${formatWhen(rec.startedAt)} · ${rec.moveCount} moves`)
  ) + '\n\n');
  lines.push(centered(cols, chalk.hex(C.muted)('y  confirm   ·   any other key  cancel')) + '\n');
  process.stdout.write(lines.join(''));
  return new Promise((resolve) => {
    const input = createInput();
    input.on((key) => {
      input.close();
      resolve(key.name === 'y');
    });
  });
}

export async function libraryScreen(store) {
  while (true) {
    const records = store.list();
    if (records.length === 0) {
      // Shouldn't be reachable because the main menu disables the library
      // option when empty, but handle it anyway.
      return { kind: 'back' };
    }
    const cols = process.stdout.columns || 80;
    let idx = 0;

    const draw = () => {
      const records = store.list();
      const lines = [CLEAR, HIDE];
      lines.push('\n');
      lines.push(centered(cols, chalk.hex(C.accent).bold(
        EMBLEM + '   ' + spaced('library') + '   ' + EMBLEM
      )) + '\n');
      lines.push(centered(cols, chalk.hex(C.muted)(`${records.length} saved ${records.length === 1 ? 'game' : 'games'}`)) + '\n\n');

      const colHeader = chalk.hex(C.muted)(
        '  ' + 'when'.padEnd(10) + '  ' + 'difficulty'.padEnd(18) +
        '  ' + 'moves'.padEnd(8) + '  ' + 'result'.padEnd(14)
      );
      lines.push(centered(cols, colHeader) + '\n');
      lines.push(centered(cols, chalk.hex(C.divider)('─'.repeat(60))) + '\n');

      const visible = records.slice(0, 12);
      for (let i = 0; i < visible.length; i++) {
        lines.push(centered(cols, formatRow(visible[i], i === idx)) + '\n');
      }

      // Preview pane.
      const picked = records[idx];
      if (picked) {
        lines.push('\n');
        lines.push(centered(cols, chalk.hex(C.subtle)(`game ${picked.id}   ·   started ${formatWhen(picked.startedAt)}`)) + '\n\n');
        for (const row of renderMiniBoard(picked.fen)) {
          lines.push(centered(cols, row) + '\n');
        }
      }

      lines.push('\n');
      lines.push(centered(cols, chalk.hex(C.muted)(
        '↑ ↓  select   ·   ↵  open   ·   d  delete   ·   esc  back'
      )) + '\n');
      process.stdout.write(lines.join(''));
    };
    draw();

    const action = await new Promise((resolve) => {
      const input = createInput();
      input.on(async (key) => {
        const recs = store.list();
        if (recs.length === 0) { input.close(); return resolve({ kind: 'back' }); }
        idx = Math.min(idx, recs.length - 1);

        if (key.name === 'up')   { idx = (idx - 1 + recs.length) % recs.length; draw(); }
        if (key.name === 'down') { idx = (idx + 1) % recs.length; draw(); }
        if (key.name === 'esc' || key.name === 'q' || key.name === 'ctrl-c') {
          input.close(); resolve({ kind: 'back' });
        }
        if (key.name === 'enter' || key.name === 'space') {
          input.close(); resolve({ kind: 'open', record: recs[idx] });
        }
        if (key.name === 'd') {
          input.close();
          const ok = await confirmDelete(process.stdout.columns || 80, recs[idx]);
          if (ok) store.delete(recs[idx].id);
          resolve({ kind: 'refresh' });
        }
      });
    });

    process.stdout.write(CLEAR + SHOW);
    if (action.kind !== 'refresh') return action;
    // else: loop and redraw
  }
}
