import { aiMove } from 'js-chess-engine';
import { DIFFICULTIES } from './theme.js';

// Given a chess.js Chess instance and a UI difficulty (1..5), return the
// engine's chosen move in chess.js form: { from, to } in lowercase algebraic.
export function think(chess, difficulty) {
  const entry = DIFFICULTIES[Math.max(0, Math.min(DIFFICULTIES.length - 1, difficulty - 1))];
  const fen = chess.fen();
  const raw = aiMove(fen, entry.depth);
  const [from, to] = Object.entries(raw)[0];
  return { from: from.toLowerCase(), to: to.toLowerCase() };
}

// Kick the engine off on a worker-ish timer so the UI can render the
// "thinking…" spinner while we compute. js-chess-engine is synchronous, so
// we just wrap the call in a Promise that yields control first.
export function thinkAsync(chess, difficulty) {
  return new Promise((resolve, reject) => {
    setImmediate(() => {
      try { resolve(think(chess, difficulty)); }
      catch (err) { reject(err); }
    });
  });
}
