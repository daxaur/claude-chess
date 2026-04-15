import chalk from 'chalk';
import { C, EMBLEM, spaced, divider } from './theme.js';

// A help overlay: centered panel that lists every keybinding grouped by
// intent. Rendered as an array of lines that callers can paint over the
// top of whatever screen they're currently showing.

const SECTIONS = [
  {
    heading: 'moving the cursor',
    rows: [
      ['← → ↑ ↓',       'move the cursor one square'],
      ['home / end',    'jump to the ends of the current rank'],
    ],
  },
  {
    heading: 'making a move',
    rows: [
      ['↵   enter',     'pick up a piece, then drop it on a target'],
      ['space',         'same as enter'],
      ['esc',           'cancel the current selection'],
      ['u',             'undo your last move (Claude undoes too)'],
      ['r',             'resign the game'],
    ],
  },
  {
    heading: 'moving between screens',
    rows: [
      ['m',             'back to the main menu (game saves first)'],
      ['l',             'open the game library'],
      ['n',             'start a new game'],
      ['?   or   h',    'toggle this help overlay'],
      ['q',             'quit claude-chess (game saves first)'],
    ],
  },
  {
    heading: 'about the board',
    rows: [
      ['outlined pieces',  'your army  (♙ ♘ ♗ ♖ ♕ ♔)'],
      ['filled pieces',    'Claude’s army  (♟ ♞ ♝ ♜ ♛ ♚)'],
      ['green square',     'the piece you just picked up'],
      ['blue squares',     'legal moves for the piece you picked up'],
      ['grey dots',        'legal moves for the piece under the cursor'],
      ['amber squares',    'the last move played'],
      ['red king square',  'the side to move is in check'],
    ],
  },
];

const BOX_WIDTH = 64;

export function renderHelpOverlay() {
  const lines = [];
  const pad = (s) => {
    const vis = s.replace(/\u001b\[[0-9;]*m/g, '').length;
    return s + ' '.repeat(Math.max(0, BOX_WIDTH - 2 - vis));
  };

  const top    = '╭' + '─'.repeat(BOX_WIDTH - 2) + '╮';
  const bottom = '╰' + '─'.repeat(BOX_WIDTH - 2) + '╯';
  const side   = (body) => chalk.hex(C.accentDim)('│') + pad(body) + chalk.hex(C.accentDim)('│');

  lines.push(chalk.hex(C.accentDim)(top));

  const title = ` ${EMBLEM}   ${chalk.hex(C.accent).bold(spaced('keybindings'))}   ${EMBLEM} `;
  lines.push(side(title));
  lines.push(side(' ' + chalk.hex(C.muted)('every shortcut in claude-chess')));
  lines.push(side(''));

  for (const section of SECTIONS) {
    lines.push(side(' ' + chalk.hex(C.accent).bold(section.heading)));
    for (const [keys, desc] of section.rows) {
      const keyStr  = chalk.hex(C.text).bold(keys.padEnd(18));
      const descStr = chalk.hex(C.subtle)(desc);
      lines.push(side(`   ${keyStr}  ${descStr}`));
    }
    lines.push(side(''));
  }

  lines.push(side(' ' + chalk.hex(C.muted)('press any key to dismiss')));
  lines.push(chalk.hex(C.accentDim)(bottom));

  return lines;
}

export const HELP_WIDTH = BOX_WIDTH;
