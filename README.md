# claude-chess

Play chess against Claude in your terminal. Beautiful unicode board, crisp ANSI rendering, multiple difficulty levels, and ships as a Claude Code plugin so you can launch it with `/chess`.

```
       ╔══════════════════════════════════════════╗
       ║         c l a u d e - c h e s s          ║
       ╚══════════════════════════════════════════╝

            a     b     c     d     e     f     g     h
         ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
       8 │  ♜  │  ♞  │  ♝  │  ♛  │  ♚  │  ♝  │  ♞  │  ♜  │ 8
         ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
       7 │  ♟  │  ♟  │  ♟  │  ♟  │  ♟  │  ♟  │  ♟  │  ♟  │ 7
         ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
         ...
```

## Features

- **Unicode chess pieces** rendered with ANSI color — white vs black, light/dark squares, highlighted moves.
- **Claude as your opponent** — pluggable engine with difficulty levels from *Intern* to *Grandmaster*.
- **Animated intro** — watch Claude suit up for the match.
- **Keyboard navigation** — arrow keys to move cursor, enter to select/move, `u` to undo, `r` to resign, `q` to quit.
- **Move history + captured pieces** panel alongside the board.
- **Claude Code plugin** — drop the repo into `~/.claude/plugins/` and invoke `/chess` inside Claude Code.

## Install

```bash
git clone https://github.com/daxaur/claude-chess.git
cd claude-chess
npm install
npm start
```

Or install globally so `claude-chess` is on your PATH:

```bash
npm install -g .
claude-chess
```

## Use as a Claude Code plugin

```bash
# Symlink (or clone) this repo into your plugins directory
ln -s "$(pwd)" ~/.claude/plugins/claude-chess
```

Then inside Claude Code:

```
/chess
```

The slash command opens a new Terminal window running the game, so it never
takes over your Claude Code session. On Linux or Windows the command prints
instructions to run `claude-chess` (or `node ~/.claude/plugins/claude-chess/bin/claude-chess.js`)
in a terminal of your choice.

### Project layout

```
claude-chess/
├── .claude-plugin/plugin.json   # plugin metadata
├── commands/chess.md            # /chess slash command
├── skills/chess/SKILL.md        # modern skill entry point
├── bin/claude-chess.js          # CLI entry (spawned by the plugin)
└── src/                         # board, sidebar, engine, game loop
```

## Controls

| Key         | Action                             |
|-------------|------------------------------------|
| ← → ↑ ↓     | Move cursor                        |
| Enter / Space | Select piece / confirm move      |
| Esc         | Cancel selection                   |
| `u`         | Undo last move                     |
| `r`         | Resign                             |
| `n`         | New game                           |
| `q`         | Quit                               |

## Difficulty levels

| Level | Label       | Engine depth |
|-------|-------------|--------------|
| 1     | Intern      | 0 (random-ish)|
| 2     | Hobbyist    | 1            |
| 3     | Club player | 2            |
| 4     | Expert      | 3            |
| 5     | Grandmaster | 4            |

## License

MIT
