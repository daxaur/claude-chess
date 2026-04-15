import chalk from 'chalk';
import { PIECES, C, SQ_W, SQ_H } from './theme.js';

// File letters and rank numbers (from white's perspective).
const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

// Decide the background color for a square given its state.
function squareBg(file, rank, state) {
  const sq = file + rank;
  const isLight = (FILES.indexOf(file) + rank) % 2 === 1;

  // King-in-check overrides everything.
  if (state.checkSquare === sq) return C.check;

  if (state.selected === sq)
    return isLight ? C.selectLight : C.selectDark;

  if (state.legalTargets?.has(sq))
    return isLight ? C.moveHintLight : C.moveHintDark;

  if (state.lastMove && (sq === state.lastMove.from || sq === state.lastMove.to))
    return isLight ? C.lastMoveLight : C.lastMoveDark;

  if (state.cursor === sq)
    return isLight ? C.cursorLight : C.cursorDark;

  return isLight ? C.light : C.dark;
}

// Render a single piece into its square content (5 cells).
function pieceCell(piece, bg) {
  if (!piece) return chalk.bgHex(bg)('     ');
  const fg = piece.color === 'w' ? C.whitePiece : C.blackPiece;
  const g = PIECES[piece.color][piece.type];
  // "  X  " — piece centered in 5 cells.
  return chalk.bgHex(bg).hex(fg).bold(`  ${g}  `);
}

// Blank top/bottom half of a square (5 cells, background-only).
function emptyCell(bg) {
  return chalk.bgHex(bg)('     ');
}

// Return the rendered board as an array of lines (no cursor positioning —
// the caller places it wherever it wants). 8 ranks × 2 rows = 16 rows,
// plus 2 coordinate rows (top files / bottom files) = 18 rows total.
// Total width: 3 (rank gutter) + 8*5 + 3 (rank gutter right) = 46.
export function renderBoard(chess, state) {
  const lines = [];
  const gutter = '   ';              // 3 chars for rank labels

  // Top file labels: "    a    b    c    d    e    f    g    h   "
  const fileLabel = chalk.hex(C.subtle)(
    gutter + FILES.map((f) => `  ${f}  `).join('') + gutter
  );
  lines.push(fileLabel);

  const blankGutter = '   ';
  for (const rank of RANKS) {
    const rankLabel = chalk.hex(C.subtle).bold(` ${rank} `);
    let top = blankGutter;
    let mid = rankLabel;
    for (const file of FILES) {
      const bg = squareBg(file, rank, state);
      const piece = chess.get(file + rank);
      top += emptyCell(bg);
      mid += pieceCell(piece, bg);
    }
    top += blankGutter;
    mid += rankLabel;
    lines.push(top);
    lines.push(mid);
  }

  lines.push(fileLabel);
  return lines;
}

// Width of the board block (for layout alongside a sidebar).
export const BOARD_WIDTH = 3 + 8 * SQ_W + 3; // 46

export { FILES, RANKS, SQ_H };
