// Normalize raw stdin keypresses into symbolic keys.
// Emits one of: 'up','down','left','right','enter','space','esc','tab',
// 'ctrl-c','q','r','n','u','h','?', or { char }.
export function createInput(stdin = process.stdin) {
  if (!stdin.isTTY) {
    throw new Error('claude-chess requires an interactive TTY.');
  }
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  const listeners = new Set();
  const onData = (data) => {
    const key = parse(data);
    for (const fn of listeners) fn(key, data);
  };
  stdin.on('data', onData);

  return {
    on(fn)   { listeners.add(fn); },
    off(fn)  { listeners.delete(fn); },
    close()  {
      stdin.off('data', onData);
      try { stdin.setRawMode(false); } catch {}
      stdin.pause();
    },
  };
}

function parse(data) {
  // Arrow / escape sequences
  if (data === '\u001b[A') return { name: 'up' };
  if (data === '\u001b[B') return { name: 'down' };
  if (data === '\u001b[C') return { name: 'right' };
  if (data === '\u001b[D') return { name: 'left' };
  if (data === '\u001b')    return { name: 'esc' };
  if (data === '\r' || data === '\n') return { name: 'enter' };
  if (data === ' ') return { name: 'space' };
  if (data === '\t') return { name: 'tab' };
  if (data === '\u0003') return { name: 'ctrl-c' };
  if (data === '\u007f' || data === '\b') return { name: 'backspace' };
  // Single character
  if (data.length === 1) return { name: data.toLowerCase(), char: data };
  return { name: 'raw', char: data };
}
