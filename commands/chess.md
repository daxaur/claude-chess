---
description: Launch a chess match against Claude. Splits your tmux pane (when in tmux) so Claude Code and chess stay visible side by side; falls back to a new Terminal window otherwise.
allowed-tools: Bash(claude-chess-launch:*), Bash(tmux:*), Bash(osascript:*), Bash(node:*)
---

Run `claude-chess-launch` using the Bash tool. This launcher handles the
surface selection itself:

- **Inside tmux** (the preferred path): it splits the current pane
  horizontally and starts the chess game in the new pane. Both Claude Code
  and the chess board stay visible in the same terminal window; switch
  focus with `ctrl-b ←/→` and zoom a pane with `ctrl-b z`.
- **macOS without tmux**: opens a new Terminal.app window running the game.
- **Anywhere else**: prints instructions and exits non-zero (a TUI can't
  take over Claude Code's terminal directly).

After running, report back briefly:

- What the launcher did (tmux split / new window / instructions printed).
- Relay the controls once:
  - Arrow keys move the cursor
  - Enter selects a piece, then Enter again makes the move
  - `u` undo · `r` resign · `n` new game · `m` menu · `l` library · `q` quit
  - Every move auto-saves — quit any time and pick up from the main menu

Do not play for the user and do not render the board in chat — the TUI
owns the chess experience.
