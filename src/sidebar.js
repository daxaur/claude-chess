import chalk from 'chalk';
import { PIECES, C, DIFFICULTIES } from './theme.js';

// Render the right-side info panel. Returns an array of lines.
// Width is fixed at SIDEBAR_WIDTH characters.
export const SIDEBAR_WIDTH = 30;

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function line(s = '') {
  // Pad to SIDEBAR_WIDTH (without counting ANSI).
  const visible = stripAnsi(s);
  const pad = Math.max(0, SIDEBAR_WIDTH - visible.length);
  return s + ' '.repeat(pad);
}

function stripAnsi(s) {
  return s.replace(/\u001b\[[0-9;]*m/g, '');
}

function header(label) {
  return chalk.hex(C.accent).bold(label);
}

function divider() {
  return chalk.hex(C.accentDim)('─'.repeat(SIDEBAR_WIDTH));
}

// Format captured-piece list and material balance.
function capturedSummary(chess) {
  // chess.js history gives us each move, including captured pieces.
  const lost = { w: [], b: [] };
  for (const mv of chess.history({ verbose: true })) {
    if (mv.captured) {
      // `captured` is the piece type of the piece that got taken;
      // its color is the opposite of the mover.
      const owner = mv.color === 'w' ? 'b' : 'w';
      lost[owner].push(mv.captured);
    }
  }
  const fmt = (color) =>
    lost[color]
      .map((t) => PIECES[color][t])
      .join(' ') || chalk.hex(C.subtle)('—');

  const materialBalance = () => {
    const sum = (arr) => arr.reduce((n, t) => n + PIECE_VALUES[t], 0);
    const diff = sum(lost.b) - sum(lost.w); // positive = white ahead
    if (diff === 0) return '';
    const sign = diff > 0 ? '+' : '';
    const who = diff > 0 ? 'white' : 'black';
    return chalk.hex(C.subtle)(` ${sign}${diff} ${who}`);
  };

  return {
    whiteTook: chalk.hex(C.whitePiece).bold(fmt('b')),
    blackTook: chalk.hex(C.blackPiece).bold(fmt('w')),
    balance:   materialBalance(),
  };
}

// Format move history into two-column SAN lines: "  1. e4     e5"
function moveHistoryLines(chess, maxLines) {
  const history = chess.history();
  const rows = [];
  for (let i = 0; i < history.length; i += 2) {
    const n = (i / 2 + 1).toString().padStart(2, ' ');
    const white = (history[i] ?? '').padEnd(7);
    const black = (history[i + 1] ?? '').padEnd(7);
    rows.push(
      chalk.hex(C.subtle)(`${n}. `) +
      chalk.hex(C.text)(white) +
      chalk.hex(C.text)(black)
    );
  }
  // Keep only the last maxLines rows so the sidebar stays bounded.
  return rows.slice(-maxLines);
}

export function renderSidebar(chess, { difficulty, thinking, status, playerColor }) {
  const diff = DIFFICULTIES[difficulty - 1];
  const turn = chess.turn() === 'w' ? 'white' : 'black';
  const { whiteTook, blackTook, balance } = capturedSummary(chess);

  const lines = [];
  lines.push(line(header('OPPONENT')));
  lines.push(line(
    chalk.hex(C.accent).bold('  ♚ Claude  ') +
    chalk.hex(C.subtle)(`Lv.${difficulty} ${diff.label}`)
  ));
  lines.push(line(chalk.hex(C.subtle)('  ' + diff.hint)));
  lines.push('');
  lines.push(line(divider()));
  lines.push('');

  lines.push(line(header('TURN')));
  const turnMark = thinking
    ? chalk.hex(C.accent).bold('  Claude is thinking…')
    : turn === playerColor
      ? chalk.hex(C.success).bold('  Your move')
      : chalk.hex(C.accent).bold('  Claude’s move');
  lines.push(line(turnMark));
  if (chess.inCheck())
    lines.push(line(chalk.hex(C.danger).bold('  ⚠  CHECK')));
  lines.push('');

  lines.push(line(header('CAPTURED')));
  lines.push(line(chalk.hex(C.subtle)('  white took  ') + whiteTook));
  lines.push(line(chalk.hex(C.subtle)('  black took  ') + blackTook));
  if (balance) lines.push(line('  material' + balance));
  lines.push('');

  lines.push(line(header('MOVES')));
  const moves = moveHistoryLines(chess, 10);
  if (moves.length === 0) {
    lines.push(line(chalk.hex(C.subtle)('  (no moves yet)')));
  } else {
    for (const row of moves) lines.push(line('  ' + row));
  }

  // Pad status at the bottom if present (checkmate etc.)
  if (status?.kind && status.kind !== 'playing') {
    lines.push('');
    lines.push(line(divider()));
    lines.push(line(chalk.hex(C.danger).bold('  ' + (status.message ?? status.kind.toUpperCase()))));
  }

  return lines;
}
