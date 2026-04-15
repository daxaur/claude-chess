import chalk from 'chalk';
import { Chess } from 'chess.js';
import { C, CLEAR, SHOW } from './theme.js';
import { Screen } from './screen.js';
import { createInput } from './input.js';
import { renderBoard, BOARD_WIDTH, FILES } from './board.js';
import { renderSidebar, SIDEBAR_WIDTH } from './sidebar.js';
import { think } from './engine.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Coords helpers — we always view from white's side, so screen up = rank+1.
function shiftCursor(sq, df, dr) {
  const f = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const r = parseInt(sq[1], 10);
  const nf = Math.max(0, Math.min(7, f + df));
  const nr = Math.max(1, Math.min(8, r + dr));
  return String.fromCharCode('a'.charCodeAt(0) + nf) + nr;
}

function findKingSquare(chess, color) {
  const rows = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const cell = rows[r][f];
      if (cell && cell.type === 'k' && cell.color === color) {
        return FILES[f] + (8 - r);
      }
    }
  }
  return null;
}

function evaluateStatus(chess, resigned = null) {
  if (resigned) return { kind: 'resigned', message: `${resigned === 'w' ? 'You' : 'Claude'} resigned` };
  if (chess.isCheckmate()) {
    const loser = chess.turn(); // side to move is mated
    const msg = loser === 'w' ? 'Checkmate — Claude wins' : 'Checkmate — you win!';
    return { kind: 'checkmate', message: msg };
  }
  if (chess.isStalemate())       return { kind: 'stalemate',   message: 'Stalemate — it’s a draw' };
  if (chess.isThreefoldRepetition()) return { kind: 'draw',    message: 'Draw by repetition' };
  if (chess.isInsufficientMaterial())return { kind: 'draw',    message: 'Draw — insufficient material' };
  if (chess.isDraw())            return { kind: 'draw',        message: 'Draw (50-move rule)' };
  return { kind: 'playing' };
}

// Compose header + board + sidebar into the frame buffer.
function drawFrame(screen, chess, viewState) {
  const { difficulty, thinking, status, playerColor, cursor, selected, legalTargets, lastMove } = viewState;

  // Row coordinates (1-indexed for ANSI moveTo).
  const HEADER_ROW = 1;
  const BOARD_ROW  = 5;
  const SIDEBAR_COL = BOARD_WIDTH + 4;

  screen.clear().hideCursor();

  // Header banner (kept simple so it's always visible at the top).
  const title = chalk.hex(C.accent).bold('♔  c l a u d e   ·   c h e s s');
  const version = chalk.hex(C.subtle)('v0.1');
  screen.at(HEADER_ROW, 3, title);
  screen.at(HEADER_ROW, BOARD_WIDTH + SIDEBAR_WIDTH, version);
  screen.at(HEADER_ROW + 1, 3, chalk.hex(C.accentDim)('─'.repeat(BOARD_WIDTH + SIDEBAR_WIDTH + 4)));

  // Board
  const boardLines = renderBoard(chess, {
    cursor,
    selected,
    legalTargets,
    lastMove,
    checkSquare: chess.inCheck() ? findKingSquare(chess, chess.turn()) : null,
  });
  screen.block(BOARD_ROW, 2, boardLines);

  // Sidebar
  const sidebarLines = renderSidebar(chess, { difficulty, thinking, status, playerColor });
  screen.block(BOARD_ROW, SIDEBAR_COL, sidebarLines);

  // Footer with controls + hint about current selection.
  const footerRow = BOARD_ROW + 20;
  const selHint = selected
    ? chalk.hex(C.success)(`selected ${selected.toUpperCase()}`)
    : chalk.hex(C.subtle)('no selection');
  const cursorHint = chalk.hex(C.text)(`cursor ${cursor.toUpperCase()}`);
  screen.at(footerRow, 3, `${cursorHint}   ·   ${selHint}`);
  screen.at(
    footerRow + 1,
    3,
    chalk.hex(C.subtle)(
      '← → ↑ ↓ move   ·   ↵ select / move   ·   esc cancel   ·   u undo   ·   r resign   ·   n new   ·   q quit'
    )
  );

  screen.flush();
}

export async function runGame({ difficulty, playerColor = 'w' }) {
  const chess = new Chess();
  const screen = new Screen();

  let cursor = 'e2';
  let selected = null;
  let legalTargets = new Set();
  let lastMove = null;
  let status = { kind: 'playing' };
  let thinking = false;
  let resolveExit;

  const view = () => ({
    difficulty, thinking, status, playerColor,
    cursor, selected, legalTargets, lastMove,
  });
  const draw = () => drawFrame(screen, chess, view());

  function setSelection(sq) {
    selected = sq;
    if (sq) {
      const moves = chess.moves({ square: sq, verbose: true });
      legalTargets = new Set(moves.map((m) => m.to));
    } else {
      legalTargets = new Set();
    }
  }

  // Attempt a move by the human player. Returns true if played.
  // chess.js throws on illegal moves, so we guard with try/catch even though
  // legalTargets should already filter out bad squares.
  function tryHumanMove(from, to) {
    let move = null;
    try {
      move = chess.move({ from, to, promotion: 'q' });
    } catch {
      return false;
    }
    if (!move) return false;
    lastMove = { from: move.from, to: move.to };
    setSelection(null);
    return true;
  }

  async function claudeMove() {
    if (status.kind !== 'playing') return;
    thinking = true;
    draw();
    await sleep(400); // dramatic pause so the user sees "thinking…"
    try {
      const mv = think(chess, difficulty);
      // js-chess-engine can occasionally propose a move chess.js rejects
      // (e.g. an en-passant it thought was legal). Fall back to any legal
      // move so the game never deadlocks.
      let move = null;
      try {
        move = chess.move({ from: mv.from, to: mv.to, promotion: 'q' });
      } catch {
        const legal = chess.moves({ verbose: true });
        if (legal.length > 0) {
          const pick = legal[Math.floor(Math.random() * legal.length)];
          move = chess.move({ from: pick.from, to: pick.to, promotion: 'q' });
        }
      }
      if (move) lastMove = { from: move.from, to: move.to };
    } catch {
      // Engine couldn't find a move at all.
    }
    thinking = false;
    status = evaluateStatus(chess);
    draw();
  }

  function undoLastPair() {
    // Undo Claude's move, then the player's, so it's our turn again.
    const a = chess.undo();
    const b = chess.undo();
    if (!a && !b) return;
    // Recover lastMove from history, if any.
    const h = chess.history({ verbose: true });
    lastMove = h.length ? { from: h[h.length - 1].from, to: h[h.length - 1].to } : null;
    setSelection(null);
    status = evaluateStatus(chess);
  }

  const input = createInput();
  const handler = async (key) => {
    if (key.name === 'ctrl-c') {
      status = { kind: 'quit' };
      return resolveExit(status);
    }
    if (thinking) return;

    // Terminal controls available even when the game is over.
    if (key.name === 'q') {
      status = { kind: 'quit' };
      return resolveExit(status);
    }
    if (key.name === 'n') {
      return resolveExit({ kind: 'newgame' });
    }

    if (status.kind !== 'playing') {
      // any other key on game-over screen just redraws
      draw();
      return;
    }

    switch (key.name) {
      case 'up':    cursor = shiftCursor(cursor, 0,  1); draw(); return;
      case 'down':  cursor = shiftCursor(cursor, 0, -1); draw(); return;
      case 'left':  cursor = shiftCursor(cursor, -1, 0); draw(); return;
      case 'right': cursor = shiftCursor(cursor,  1, 0); draw(); return;
      case 'esc':   setSelection(null); draw(); return;
      case 'u':     undoLastPair(); draw(); return;
      case 'r': {
        status = { kind: 'resigned', message: 'You resigned — Claude wins' };
        draw();
        return;
      }
      case 'enter':
      case 'space': {
        if (chess.turn() !== playerColor) return;
        if (!selected) {
          const piece = chess.get(cursor);
          if (piece && piece.color === playerColor) setSelection(cursor);
          draw();
          return;
        }
        // A piece is already selected: either move, re-select, or cancel.
        if (legalTargets.has(cursor)) {
          if (tryHumanMove(selected, cursor)) {
            status = evaluateStatus(chess);
            draw();
            if (status.kind === 'playing') await claudeMove();
          }
          return;
        }
        const piece = chess.get(cursor);
        if (piece && piece.color === playerColor && cursor !== selected) {
          setSelection(cursor);
          draw();
          return;
        }
        setSelection(null);
        draw();
        return;
      }
    }
  };

  input.on(handler);

  return new Promise((resolve) => {
    resolveExit = (s) => {
      input.off(handler);
      input.close();
      process.stdout.write(CLEAR + SHOW);
      resolve(s);
    };
    draw();
  });
}
