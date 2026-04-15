import chalk from 'chalk';
import { Chess } from 'chess.js';
import {
  C, EMBLEM, CLEAR, SHOW, spaced, DIFFICULTIES,
} from './theme.js';
import { Screen } from './screen.js';
import { createInput } from './input.js';
import { renderBoard, BOARD_WIDTH, FILES } from './board.js';
import { renderSidebar, SIDEBAR_WIDTH } from './sidebar.js';
import { thinkAsync } from './engine.js';
import { createShimmer } from './spinner.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Move the cursor by (df, dr) file/rank deltas, clamped to the board.
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

function evaluateResult(chess, playerColor) {
  if (chess.isCheckmate()) {
    return chess.turn() === playerColor
      ? { kind: 'checkmate-claude', message: 'Checkmate — Claude wins' }
      : { kind: 'checkmate-user',   message: 'Checkmate — you win!' };
  }
  if (chess.isStalemate())            return { kind: 'stalemate', message: 'Stalemate — draw' };
  if (chess.isThreefoldRepetition())  return { kind: 'draw',      message: 'Draw by repetition' };
  if (chess.isInsufficientMaterial()) return { kind: 'draw',      message: 'Draw — insufficient material' };
  if (chess.isDraw())                 return { kind: 'draw',      message: 'Draw (50-move rule)' };
  return { kind: 'playing' };
}

function drawHeader(screen, { record, saveBlip }) {
  const diff = DIFFICULTIES[record.difficulty - 1];
  const left = chalk.hex(C.accent).bold(EMBLEM) + '  ' +
               chalk.hex(C.text).bold(spaced('claude · chess'));
  const right = chalk.hex(C.subtle)(
    `game ${record.id}  ·  Lv.${record.difficulty} ${diff.label}  ·  `
  ) + (saveBlip
    ? chalk.hex(C.success)('● saved')
    : chalk.hex(C.muted)('○ autosave'));
  screen.at(1, 3, left);
  const totalWidth = BOARD_WIDTH + SIDEBAR_WIDTH + 4;
  const stripped = right.replace(/\u001b\[[0-9;]*m/g, '');
  const col = Math.max(3, totalWidth - stripped.length + 3);
  screen.at(1, col, right);
  screen.at(2, 3, chalk.hex(C.divider)('─'.repeat(totalWidth)));
}

function drawFooter(screen, { cursor, selected, status }, rowOffset) {
  const row = rowOffset;
  const selHint = selected
    ? chalk.hex(C.success)(`selected ${selected.toUpperCase()}`)
    : chalk.hex(C.muted)('no selection');
  const cursorHint = chalk.hex(C.text)(`cursor ${cursor.toUpperCase()}`);
  screen.at(row, 3, `${cursorHint}   ·   ${selHint}`);

  const keys = status?.kind && status.kind !== 'playing'
    ? '↵ / n  new game   ·   l  library   ·   q  quit'
    : '← → ↑ ↓  move   ·   ↵  select / move   ·   esc  cancel   ·   u  undo   ·   r  resign   ·   m  menu   ·   q  quit';
  screen.at(row + 1, 3, chalk.hex(C.muted)(keys));
}

export async function runGame({ store, record }) {
  const chess = new Chess();
  // Replay PGN if we're resuming an existing game.
  if (record.pgn) {
    try { chess.loadPgn(record.pgn); }
    catch { /* corrupt save — start fresh at stored FEN if possible */
      try { chess.load(record.fen); } catch { /* ignore */ }
    }
  }

  const screen = new Screen();
  const playerColor = record.playerColor ?? 'w';

  let cursor = playerColor === 'w' ? 'e2' : 'e7';
  let selected = null;
  let legalTargets = new Set();
  let lastMove = null;
  let status = evaluateResult(chess, playerColor);
  let thinking = false;
  let saveBlip = false;
  let saveBlipTimer = null;
  let shimmer = null;
  let shimmerTimer = null;
  let resolveExit;

  const flashSave = () => {
    saveBlip = true;
    if (saveBlipTimer) clearTimeout(saveBlipTimer);
    saveBlipTimer = setTimeout(() => { saveBlip = false; draw(); }, 700);
  };

  const persist = (patch = {}) => {
    const rec = store.update(record.id, {
      pgn: chess.pgn(),
      fen: chess.fen(),
      moveCount: chess.history().length,
      ...patch,
    });
    if (rec) Object.assign(record, rec);
    flashSave();
  };

  const draw = () => {
    screen.clear().hideCursor();
    drawHeader(screen, { record, saveBlip });

    const checkSquare = chess.inCheck() ? findKingSquare(chess, chess.turn()) : null;
    const boardLines = renderBoard(chess, {
      cursor, selected, legalTargets, lastMove, checkSquare,
    });
    const sidebarLines = renderSidebar(chess, {
      difficulty: record.difficulty,
      thinking,
      spinnerFrame: shimmer?.frame(),
      status,
      playerColor,
      gameId: record.id,
      autosaved: saveBlip,
    });

    const BOARD_ROW = 5;
    screen.block(BOARD_ROW, 2, boardLines);
    screen.block(BOARD_ROW, BOARD_WIDTH + 4, sidebarLines);

    drawFooter(screen, { cursor, selected, status }, BOARD_ROW + 20);

    // Game-over overlay — painted over the top of the footer space.
    if (status?.kind && status.kind !== 'playing') {
      const banner = ' '.repeat(2) + chalk.hex(C.accent).bold(
        EMBLEM + '  ' + (status.message ?? status.kind.toUpperCase())
      );
      screen.at(BOARD_ROW + 19, 3, banner);
    }
    screen.flush();
  };

  // Start / stop the shimmer animation ticker.
  const startShimmer = () => {
    shimmer = createShimmer();
    shimmerTimer = setInterval(() => { shimmer.tick(); draw(); }, 90);
  };
  const stopShimmer = () => {
    if (shimmerTimer) { clearInterval(shimmerTimer); shimmerTimer = null; }
    shimmer = null;
  };

  function setSelection(sq) {
    selected = sq;
    if (sq) {
      legalTargets = new Set(
        chess.moves({ square: sq, verbose: true }).map((m) => m.to)
      );
    } else {
      legalTargets = new Set();
    }
  }

  function tryHumanMove(from, to) {
    let move = null;
    try { move = chess.move({ from, to, promotion: 'q' }); }
    catch { return false; }
    if (!move) return false;
    lastMove = { from: move.from, to: move.to };
    setSelection(null);
    return true;
  }

  async function claudeMove() {
    if (status.kind !== 'playing') return;
    thinking = true;
    startShimmer();
    draw();

    // Keep the "thinking" frame visible long enough to read at high depth.
    const minPause = 500 + record.difficulty * 80;
    const started = Date.now();

    let mv = null;
    try { mv = await thinkAsync(chess, record.difficulty); }
    catch { /* fall through */ }

    const elapsed = Date.now() - started;
    if (elapsed < minPause) await sleep(minPause - elapsed);

    let move = null;
    if (mv) {
      try { move = chess.move({ from: mv.from, to: mv.to, promotion: 'q' }); }
      catch {
        const legal = chess.moves({ verbose: true });
        if (legal.length > 0) {
          const pick = legal[0];
          try { move = chess.move({ from: pick.from, to: pick.to, promotion: 'q' }); }
          catch { /* ignore */ }
        }
      }
    }
    if (move) lastMove = { from: move.from, to: move.to };

    stopShimmer();
    thinking = false;
    status = evaluateResult(chess, playerColor);
    persist({ result: status.kind === 'playing' ? 'playing' : status.kind });
    draw();
  }

  function undoLastPair() {
    const a = chess.undo();
    const b = chess.undo();
    if (!a && !b) return;
    const h = chess.history({ verbose: true });
    lastMove = h.length ? { from: h[h.length - 1].from, to: h[h.length - 1].to } : null;
    setSelection(null);
    status = evaluateResult(chess, playerColor);
    persist({ result: status.kind === 'playing' ? 'playing' : status.kind });
  }

  const input = createInput();
  const handler = async (key) => {
    if (key.name === 'ctrl-c') {
      persist();
      return resolveExit({ kind: 'quit' });
    }
    if (thinking) return;

    if (key.name === 'q') {
      persist();
      return resolveExit({ kind: 'quit' });
    }
    if (key.name === 'm') {
      persist();
      return resolveExit({ kind: 'menu' });
    }
    if (key.name === 'l') {
      persist();
      return resolveExit({ kind: 'library' });
    }

    if (status.kind !== 'playing') {
      // After game-over, ↵ or `n` starts a new game; anything else ignored.
      if (key.name === 'enter' || key.name === 'space' || key.name === 'n') {
        return resolveExit({ kind: 'newgame' });
      }
      return;
    }

    switch (key.name) {
      case 'up':    cursor = shiftCursor(cursor, 0,  1); draw(); return;
      case 'down':  cursor = shiftCursor(cursor, 0, -1); draw(); return;
      case 'left':  cursor = shiftCursor(cursor, -1, 0); draw(); return;
      case 'right': cursor = shiftCursor(cursor,  1, 0); draw(); return;
      case 'esc':   setSelection(null); draw(); return;
      case 'u':     undoLastPair(); draw(); return;
      case 'n':     persist(); return resolveExit({ kind: 'newgame' });
      case 'r': {
        status = { kind: 'resigned-user', message: 'You resigned — Claude wins' };
        persist({ result: 'resigned-user' });
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
        if (legalTargets.has(cursor)) {
          if (tryHumanMove(selected, cursor)) {
            status = evaluateResult(chess, playerColor);
            persist({ result: status.kind === 'playing' ? 'playing' : status.kind });
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
    resolveExit = (outcome) => {
      input.off(handler);
      input.close();
      stopShimmer();
      if (saveBlipTimer) clearTimeout(saveBlipTimer);
      process.stdout.write(CLEAR + SHOW);
      resolve(outcome);
    };
    draw();

    // If we loaded a game where it's Claude's turn, kick the engine off
    // immediately so the player sees the shimmer right away.
    if (status.kind === 'playing' && chess.turn() !== playerColor) {
      claudeMove();
    }
  });
}
