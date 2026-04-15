import { CLEAR, HIDE, SHOW, RESET, moveTo } from './theme.js';

// Thin wrapper around stdout that batches writes per frame.
export class Screen {
  constructor(stream = process.stdout) {
    this.stream = stream;
    this.buf = [];
  }
  clear()                { this.buf.push(CLEAR); return this; }
  hideCursor()           { this.buf.push(HIDE); return this; }
  showCursor()           { this.buf.push(SHOW); return this; }
  reset()                { this.buf.push(RESET); return this; }
  moveTo(row, col)       { this.buf.push(moveTo(row, col)); return this; }
  write(s)               { this.buf.push(s); return this; }
  // Write a string at (row, col). Does not wrap, does not translate newlines.
  at(row, col, s)        { this.buf.push(moveTo(row, col) + s); return this; }
  // Write a multi-line block starting at (row, col).
  block(row, col, lines) {
    lines.forEach((line, i) => this.at(row + i, col, line));
    return this;
  }
  flush() {
    if (this.buf.length === 0) return;
    this.stream.write(this.buf.join(''));
    this.buf = [];
  }
  get cols() { return this.stream.columns || 100; }
  get rows() { return this.stream.rows || 30; }
}

// Install a process exit / signal handler that restores the terminal.
export function installExitHandlers(onExit) {
  const restore = () => {
    process.stdout.write(SHOW + RESET + '\n');
    if (process.stdin.isTTY && process.stdin.setRawMode) {
      try { process.stdin.setRawMode(false); } catch {}
    }
    process.stdin.pause();
  };
  const bye = (code = 0) => {
    try { onExit?.(); } catch {}
    restore();
    process.exit(code);
  };
  process.on('SIGINT',  () => bye(0));
  process.on('SIGTERM', () => bye(0));
  process.on('exit',    restore);
  return bye;
}
