---
name: chess
description: Play a full game of chess against Claude inside a terminal TUI. Use whenever the user asks to play chess, challenge Claude, or take a break for a game.
---

# chess

This skill launches `claude-chess`, a standalone terminal chess game bundled
with this plugin. The game runs in its own Terminal window so it doesn't
interfere with the active Claude Code session.

## How to invoke

On macOS, open a new Terminal window and start the game:

```bash
osascript \
  -e 'tell application "Terminal" to activate' \
  -e 'tell application "Terminal" to do script "claude-chess 2>/dev/null || node \"$HOME/.claude/plugins/claude-chess/bin/claude-chess.js\""'
```

On Linux or Windows (no osascript), tell the user to launch `claude-chess`
themselves — the binary lives at
`$HOME/.claude/plugins/claude-chess/bin/claude-chess.js` and can be run with
`node`.

## Controls to mention

- Arrows — move cursor
- Enter — select piece / make move
- `u` — undo
- `r` — resign
- `n` — new game
- `q` — quit

## Do not

- Do not attempt to play the game for the user (no tool calls simulating moves).
- Do not render chess boards in the chat — the TUI is the chess experience.
