---
name: chess
description: Play a full game of chess against Claude while you work. Launches a clean unicode TUI in a tmux split-pane (when available) so it stays visible alongside Claude Code. Use whenever the user asks to play chess, challenge Claude, or wants a quick break.
---

# chess

This skill launches `claude-chess`, a standalone terminal chess game
bundled with this plugin. The game runs next to Claude Code so neither
fights the other for the TTY.

## How to invoke

Shell out (via the Bash tool) to the launcher that ships with the plugin:

```bash
claude-chess-launch
```

The launcher decides the best surface automatically:

1. **Inside tmux** — splits the current pane horizontally, chess in the
   new pane. Both Claude Code and chess stay visible; the user switches
   focus with `ctrl-b ←/→`.
2. **macOS without tmux** — opens a new Terminal.app window.
3. **Elsewhere** — prints instructions. A TUI cannot run inside
   Claude Code's pane without tmux or a separate window.

## Tell the user

- Confirm which surface launched (tmux split / new window).
- Relay the in-game controls once:
  - Arrows — move cursor
  - Enter — select piece / make move
  - `u` — undo · `r` — resign · `n` — new game · `m` — menu · `l` — library · `q` — quit
- Mention that every move auto-saves, so they can quit any time and pick
  up from the main menu's **Continue** or **Library** option.

## Do not

- Do not attempt to play the game for the user (no simulated moves).
- Do not render chess boards in chat — the TUI is the chess experience.
- Do not invoke this skill if the user is only asking *about* chess
  (rules, history, trivia) rather than asking to play.
