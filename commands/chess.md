---
description: Launch a chess match against Claude in a new terminal window.
allowed-tools: Bash(osascript:*), Bash(claude-chess:*), Bash(node:*), Bash(which:*)
---

Launch the `claude-chess` terminal UI so the user can play a full game of chess
against Claude without leaving their workflow.

## Steps

1. On macOS, open a new Terminal.app window running the game. Prefer a globally
   installed `claude-chess` binary; fall back to invoking the plugin's `bin/`
   script directly via `node`.

   ```bash
   osascript \
     -e 'tell application "Terminal" to activate' \
     -e 'tell application "Terminal" to do script "claude-chess 2>/dev/null || node \"$HOME/.claude/plugins/claude-chess/bin/claude-chess.js\""'
   ```

2. Once launched, confirm to the user that a new Terminal window has opened and
   briefly describe the controls:

   - Arrow keys move the cursor
   - `Enter` selects a piece, then `Enter` again makes the move
   - `u` undo · `r` resign · `n` new game · `q` quit

3. If `osascript` is unavailable (Linux/Windows), tell the user to run
   `claude-chess` (or `node ~/.claude/plugins/claude-chess/bin/claude-chess.js`)
   directly in a terminal of their choice.

Do not summarise the game state or try to play for the user — the game is
self-contained in its own window.
