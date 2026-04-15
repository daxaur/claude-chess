import chalk from 'chalk';

// Outlined (white-set) glyphs for the player, filled (black-set) glyphs for
// Claude — mirrors how a physical chess set actually looks. Each side keeps
// its own piece shape even when color would otherwise make them identical.
export const PIECES = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

// Claude's signature emblem. Used as the "avatar" for the engine side
// anywhere we want to evoke the brand without raster art.
export const EMBLEM = '✦';

// Monochrome board + warm terracotta accent. Kept intentionally narrow in
// palette so the board reads as "black and white with one accent" rather
// than a video-game rainbow.
export const C = {
  // Board squares — neutral greys, a hair warmer than pure.
  light:          '#d9d4c5',
  dark:           '#3c3936',
  // Interaction states. All built off the same two base squares so the
  // focus ring still reads as "the square" and not a different widget.
  cursorLight:    '#e8dca0',
  cursorDark:     '#6a5f3e',
  selectLight:    '#b5c98f',
  selectDark:     '#4e5a3a',
  moveHintLight:  '#a6bcd0',
  moveHintDark:   '#3d4a58',
  lastMoveLight:  '#d8c28a',
  lastMoveDark:   '#5a4e32',
  check:          '#a84f47',

  // Piece colours. Keeping them hard opposites (near-white / near-black)
  // gives high contrast on every square, regardless of shade.
  whitePiece:     '#f5f2e8',
  blackPiece:     '#141210',

  // UI chrome.
  accent:         '#c27b4a',  // Claude terracotta
  accentDim:      '#7a4d2e',
  accentSoft:     '#d9a788',
  text:           '#e8e4d6',
  subtle:         '#86807a',
  muted:          '#564f48',
  bg:             '#0f0e0c',
  panel:          '#1a1815',
  success:        '#8fae66',
  danger:         '#c4625b',
  divider:        '#2a2825',
};

// Difficulty table. Displayed label + hint, plus the depth we pass to
// js-chess-engine (the same 0..4 scale its `aiMove` takes).
export const DIFFICULTIES = [
  { depth: 0, label: 'Intern',      hint: 'Random-ish moves. Gentle warm-up.' },
  { depth: 1, label: 'Hobbyist',    hint: 'Shallow search. Knows the rules.'  },
  { depth: 2, label: 'Club player', hint: 'Solid tactics. Punishes blunders.' },
  { depth: 3, label: 'Expert',      hint: 'Deep search. Plays sharp chess.'   },
  { depth: 4, label: 'Grandmaster', hint: 'Strongest setting. Good luck.'     },
];

// Square size in terminal cells: 5 wide × 2 tall.
export const SQ_W = 5;
export const SQ_H = 2;

// ANSI helpers.
export const CLEAR  = '\u001b[2J\u001b[H';
export const HIDE   = '\u001b[?25l';
export const SHOW   = '\u001b[?25h';
export const RESET  = '\u001b[0m';
export const moveTo = (row, col) => `\u001b[${row};${col}H`;

// Space-out a label, Claude Code-style: "MOVES" -> "M O V E S".
export const spaced = (s) => s.toUpperCase().split('').join(' ');

// Section header rendering used everywhere. Small, letter-spaced, muted gold.
export const sectionHeader = (label) =>
  chalk.hex(C.accent).bold(spaced(label));

export const divider = (w = 28) => chalk.hex(C.divider)('─'.repeat(w));
