import { aiMove } from 'js-chess-engine';

// Map our UI difficulty (1..5) to js-chess-engine depth (0..4).
const LEVEL_MAP = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };

// Given a chess.js-style Chess instance and a difficulty (1..5),
// return the engine's move as a { from, to } pair in lowercase
// algebraic (e.g. { from: 'e2', to: 'e4' }).
export function think(chess, difficulty) {
  const level = LEVEL_MAP[difficulty] ?? 2;
  const fen = chess.fen();
  const raw = aiMove(fen, level);          // { 'E2': 'E4' }
  const [from, to] = Object.entries(raw)[0];
  return { from: from.toLowerCase(), to: to.toLowerCase() };
}
