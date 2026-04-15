import chalk from 'chalk';
import { PIECES, C, EMBLEM, DIFFICULTIES, sectionHeader, divider } from './theme.js';

// Width of the right-hand panel (in cells). The bin uses this to lay out
// the frame — if you change it, check the overall terminal-width budget
// in bin/claude-chess.js.
export const SIDEBAR_WIDTH = 30;

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');

// Left-pad a string to SIDEBAR_WIDTH without counting ANSI codes.
const pad = (s = '') => {
  const visible = stripAnsi(s).length;
  const n = Math.max(0, SIDEBAR_WIDTH - visible);
  return s + ' '.repeat(n);
};

// Group chess.js's move history into plies by captured-piece owner.
function capturedSummary(chess) {
  const lost = { w: [], b: [] };
  for (const mv of chess.history({ verbose: true })) {
    if (mv.captured) {
      const owner = mv.color === 'w' ? 'b' : 'w';
      lost[owner].push(mv.captured);
    }
  }
  const fmt = (color) =>
    lost[color].length === 0
      ? chalk.hex(C.muted)('—')
      : lost[color].map((t) => PIECES[color][t]).join(' ');

  const sum = (arr) => arr.reduce((n, t) => n + PIECE_VALUE[t], 0);
  const diff = sum(lost.b) - sum(lost.w);
  const balance = diff === 0
    ? ''
    : chalk.hex(C.subtle)(` ${diff > 0 ? '+' : ''}${diff}`);

  return {
    white: chalk.hex(C.whitePiece).bold(fmt('b')),
    black: chalk.hex(C.accent).bold(fmt('w')),
    balance,
  };
}

// Move history rendered as two-column SAN lines: "  1.  e4      e5"
function moveHistoryLines(chess, max) {
  const hist = chess.history();
  const rows = [];
  for (let i = 0; i < hist.length; i += 2) {
    const num = (i / 2 + 1).toString().padStart(2, ' ');
    const w = (hist[i] ?? '').padEnd(7);
    const b = (hist[i + 1] ?? '').padEnd(7);
    rows.push(
      chalk.hex(C.muted)(`${num}.  `) +
      chalk.hex(C.text)(w) +
      chalk.hex(C.accentSoft)(b)
    );
  }
  return rows.slice(-max);
}

export function renderSidebar(chess, {
  difficulty,
  thinking,
  spinnerFrame,
  status,
  playerColor,
  gameId,
  autosaved,
}) {
  const diff = DIFFICULTIES[difficulty - 1];
  const captured = capturedSummary(chess);
  const turn = chess.turn();

  const lines = [];

  // Opponent card.
  lines.push(pad(sectionHeader('opponent')));
  lines.push(pad(
    ' ' + chalk.hex(C.accent).bold(EMBLEM) +
    ' ' + chalk.hex(C.text).bold('Claude')
  ));
  lines.push(pad(
    ' ' + chalk.hex(C.subtle)(`Lv.${difficulty} · ${diff.label}`)
  ));
  lines.push(pad(' ' + chalk.hex(C.muted)(diff.hint)));
  lines.push('');
  lines.push(pad(divider(SIDEBAR_WIDTH - 1)));
  lines.push('');

  // Turn indicator — either "your move", or the shimmer while Claude thinks.
  lines.push(pad(sectionHeader('turn')));
  if (thinking) {
    lines.push(pad(' ' + chalk.hex(C.accent).bold('Claude is thinking')));
    lines.push(pad(' ' + (spinnerFrame ?? '')));
  } else if (status?.kind && status.kind !== 'playing') {
    lines.push(pad(' ' + chalk.hex(C.danger).bold('game over')));
    lines.push(pad(' ' + chalk.hex(C.subtle)(status.message ?? status.kind)));
  } else if (turn === playerColor) {
    lines.push(pad(' ' + chalk.hex(C.success).bold('your move')));
    if (chess.inCheck())
      lines.push(pad(' ' + chalk.hex(C.danger).bold('⚠  you are in check')));
    else
      lines.push(pad(''));
  } else {
    lines.push(pad(' ' + chalk.hex(C.accent).bold('Claude to move')));
    lines.push(pad(''));
  }
  lines.push('');
  lines.push(pad(divider(SIDEBAR_WIDTH - 1)));
  lines.push('');

  // Captured + material balance.
  lines.push(pad(sectionHeader('captured')));
  lines.push(pad(' ' + chalk.hex(C.subtle)('you       ') + captured.white));
  lines.push(pad(' ' + chalk.hex(C.subtle)('Claude    ') + captured.black));
  if (captured.balance)
    lines.push(pad(' ' + chalk.hex(C.subtle)('material ') + captured.balance));
  lines.push('');
  lines.push(pad(divider(SIDEBAR_WIDTH - 1)));
  lines.push('');

  // Move history (last 8 rows of the ledger).
  lines.push(pad(sectionHeader('moves')));
  const moves = moveHistoryLines(chess, 8);
  if (moves.length === 0) {
    lines.push(pad(' ' + chalk.hex(C.muted)('no moves yet')));
  } else {
    for (const row of moves) lines.push(pad(' ' + row));
  }

  return lines;
}
