import chalk from 'chalk';
import { PIECES, C, SQ_W, SQ_H } from './theme.js';

// File letters and rank numbers (from white's perspective).
const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

// Decide the background colour for a square given its state. Priority,
// highest wins: check > selection > selected-move target > hover-move hint
// > last-move amber > cursor focus ring > base square.
function squareBg(file, rank, state) {
  const sq = file + rank;
  const isLight = (FILES.indexOf(file) + rank) % 2 === 1;

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

// Overlay rendered on top of the background. Currently just a hover-move
// dot: a muted centre marker that tells the player "this square is a
// legal target for the piece your cursor is on", before they've committed
// to selecting anything.
function overlayGlyph(sq, state) {
  if (state.hoverTargets?.has(sq) && !state.selected && !state.legalTargets?.has(sq))
    return '·';
  return null;
}

// Render a single piece glyph sitting on a 5-cell background.
function pieceCell(piece, bg, overlay) {
  if (!piece) {
    if (overlay) {
      return chalk.bgHex(bg).hex(C.muted).bold(`  ${overlay}  `);
    }
    return chalk.bgHex(bg)('     ');
  }
  const fg = piece.color === 'w' ? C.whitePiece : C.blackPiece;
  const g = PIECES[piece.color][piece.type];
  return chalk.bgHex(bg).hex(fg).bold(`  ${g}  `);
}

// Blank row of a square (5 cells, background only).
const emptyCell = (bg) => chalk.bgHex(bg)('     ');

// Return the rendered board as an array of lines. 8 ranks × SQ_H rows +
// 2 file-label rows. Total width: 3 + 8*SQ_W + 3.
export function renderBoard(chess, state) {
  const lines = [];
  const gutter = '   ';

  const fileLabel = chalk.hex(C.subtle)(
    gutter + FILES.map((f) => centerLabel(f)).join('') + gutter
  );
  lines.push(fileLabel);

  const blankGutter = '   ';
  for (const rank of RANKS) {
    const rankLabel = chalk.hex(C.subtle).bold(` ${rank} `);

    // Build SQ_H rows for this rank: piece sits on the MIDDLE row, the rows
    // above and below just repeat the background so the square reads as
    // one chunky tile rather than a lonely glyph on a stripe.
    const middleRowIdx = Math.floor(SQ_H / 2);
    for (let row = 0; row < SQ_H; row++) {
      const isMiddle = row === middleRowIdx;
      let line = isMiddle ? rankLabel : blankGutter;
      for (const file of FILES) {
        const sq = file + rank;
        const bg = squareBg(file, rank, state);
        const piece = chess.get(sq);
        const overlay = overlayGlyph(sq, state);
        line += isMiddle ? pieceCell(piece, bg, overlay) : emptyCell(bg);
      }
      line += isMiddle ? rankLabel : blankGutter;
      lines.push(line);
    }
  }

  lines.push(fileLabel);
  return lines;
}

// File-label centering (single letter inside a 5-cell slot).
function centerLabel(letter) { return `  ${letter}  `; }

export const BOARD_WIDTH = 3 + 8 * SQ_W + 3; // 46
export const BOARD_HEIGHT = 2 + 8 * SQ_H;    // 26

export { FILES, RANKS, SQ_H };
