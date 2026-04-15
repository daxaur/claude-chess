import chalk from 'chalk';

// Unicode chess pieces (solid glyphs — we color them ourselves).
// Using solid black glyphs for both sides so we can style via color,
// giving consistent weight across terminals.
export const PIECES = {
  w: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

// Claude brand-ish palette.
export const C = {
  // Board squares
  light: '#ead9b6',
  dark:  '#a57a4b',
  // Selection + cursor + move hints
  cursorLight: '#f6e58d',
  cursorDark:  '#c9a24f',
  selectLight: '#b7d86a',
  selectDark:  '#7fae3a',
  moveHintLight: '#8fb3e2',
  moveHintDark:  '#567bbd',
  lastMoveLight: '#e3c26a',
  lastMoveDark:  '#a37f2a',
  check:       '#e55b5b',
  // Piece colors
  whitePiece:  '#ffffff',
  blackPiece:  '#1a1a1a',
  // UI
  accent:      '#c27b4a',   // Claude terracotta
  accentDim:   '#8c573a',
  text:        '#eae4d6',
  subtle:      '#8a8577',
  bg:          '#14110f',
  panel:       '#1f1c18',
  success:     '#7fae3a',
  danger:      '#e55b5b',
};

export const DIFFICULTIES = [
  { level: 0, label: 'Intern',      hint: 'Random moves. Gentle warm-up.' },
  { level: 1, label: 'Hobbyist',    hint: 'Shallow search. Knows the rules.' },
  { level: 2, label: 'Club player', hint: 'Solid tactics. Will punish blunders.' },
  { level: 3, label: 'Expert',      hint: 'Deep search. Plays sharp chess.' },
  { level: 4, label: 'Grandmaster', hint: 'Strongest setting. Good luck.' },
];

// Square size: 5 wide x 2 tall (one border row + one content row).
export const SQ_W = 5;
export const SQ_H = 2;

// ANSI helpers (kept here to avoid circular imports).
export const esc = (s) => `\u001b[${s}`;
export const CLEAR   = '\u001b[2J\u001b[H';
export const HIDE    = '\u001b[?25l';
export const SHOW    = '\u001b[?25h';
export const RESET   = '\u001b[0m';
export const moveTo  = (row, col) => `\u001b[${row};${col}H`;

// Paint a cell background + foreground with chalk hex.
export const paint = (bg, fg, bold = false) => {
  let s = chalk.bgHex(bg).hex(fg);
  if (bold) s = s.bold;
  return s;
};
