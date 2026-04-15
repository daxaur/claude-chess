import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// Location: ~/.claude/claude-chess/games/<id>.json
// One file per game. JSON shape (v1):
// {
//   id:         "a8f2c1",
//   version:    1,
//   startedAt:  "2026-04-15T09:10:00.000Z",
//   updatedAt:  "2026-04-15T09:12:45.000Z",
//   difficulty: 3,          // 1..5 (matches DIFFICULTIES index + 1)
//   playerColor:"w",
//   pgn:        "...",      // authoritative game state
//   fen:        "...",      // convenience: current position
//   moveCount:  14,         // plies
//   result:     "playing" | "checkmate-user" | "checkmate-claude"
//                          | "stalemate" | "draw" | "resigned" | "abandoned",
// }
//
// Games in 'playing' state are "in progress" and show up as resumable. Once
// a game reaches any terminal result we stop accepting writes for it.

const DEFAULT_DIR = path.join(os.homedir(), '.claude', 'claude-chess', 'games');

export class GameStore {
  constructor(dir = DEFAULT_DIR) {
    this.dir = dir;
    try { fs.mkdirSync(this.dir, { recursive: true }); } catch {}
  }

  // Create a new game file. Returns the initial record.
  create({ difficulty, playerColor = 'w' }) {
    const now = new Date().toISOString();
    const record = {
      id: shortId(),
      version: 1,
      startedAt: now,
      updatedAt: now,
      difficulty,
      playerColor,
      pgn: '',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moveCount: 0,
      result: 'playing',
    };
    this._write(record);
    return record;
  }

  // Save state for an existing game, merging onto whatever's on disk.
  update(id, patch) {
    const existing = this.load(id);
    if (!existing) return null;
    const merged = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this._write(merged);
    return merged;
  }

  load(id) {
    const p = this._pathFor(id);
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      return null;
    }
  }

  delete(id) {
    try { fs.unlinkSync(this._pathFor(id)); return true; }
    catch { return false; }
  }

  // Every valid game file in the directory, sorted most-recent-first.
  list() {
    let entries = [];
    try { entries = fs.readdirSync(this.dir); } catch { return []; }
    const records = [];
    for (const name of entries) {
      if (!name.endsWith('.json')) continue;
      try {
        const raw = fs.readFileSync(path.join(this.dir, name), 'utf8');
        const rec = JSON.parse(raw);
        if (rec && rec.id && rec.version) records.push(rec);
      } catch {
        // Skip unreadable / malformed files — the library is best-effort.
      }
    }
    records.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    return records;
  }

  // Most recently updated game that's still in progress, or null.
  mostRecentOngoing() {
    return this.list().find((r) => r.result === 'playing') ?? null;
  }

  _pathFor(id) {
    return path.join(this.dir, `${id}.json`);
  }

  _write(record) {
    const p = this._pathFor(record.id);
    const tmp = p + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(record, null, 2));
    fs.renameSync(tmp, p);
  }
}

function shortId() {
  return crypto.randomBytes(3).toString('hex'); // 6 hex chars
}

// Human-friendly formatting helpers used by menu + library screens.
export function formatWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const min = Math.floor(diffMs / 60000);
  if (min < 1)   return 'just now';
  if (min < 60)  return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7)   return `${day}d ago`;
  return d.toISOString().slice(0, 10);
}

export function formatResult(result) {
  switch (result) {
    case 'playing':           return 'playing';
    case 'checkmate-user':    return 'you won';
    case 'checkmate-claude':  return 'Claude won';
    case 'stalemate':         return 'stalemate';
    case 'draw':              return 'draw';
    case 'resigned-user':     return 'you resigned';
    case 'resigned-claude':   return 'Claude resigned';
    case 'abandoned':         return 'abandoned';
    default:                  return result ?? '—';
  }
}
