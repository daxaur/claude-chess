# claude-chess

A terminal chess game against Claude. Clean monochrome board, outlined vs filled pieces, animated "thinking" shimmer, auto-saved games you can resume any time, and a Claude Code plugin that launches the whole thing with `/chess`.

```
          ✦   C L A U D E   ·   C H E S S   ✦          game a8f2c1  ·  Lv.3 Expert  ·  ● saved
          ─────────────────────────────────────────────────────────────────────

               a    b    c    d    e    f    g    h
           8   ♜    ♞    ♝    ♛    ♚    ♝    ♞    ♜   8       O P P O N E N T

           7   ♟    ♟    ♟    ♟         ♟    ♟    ♟   7        ✦ Claude
                                                               Lv.3 · Expert
           6                                          6        Deep search. Plays sharp chess.

           5                   ♟                      5       ─────────────────────
                                                               T U R N
           4                        ♙                 4
                                                               Claude is thinking
           3                                          3        · · ✦ · ·
           ...
```

## Why

You're pair-programming with Claude and it's compiling for 40 seconds. Or you're rubber-ducking a hard bug and need 30 seconds away from the keyboard. Or it's late and you just want to play chess in your terminal without a web browser. `claude-chess` is for any of those.

## Features

- **Chunky 5×3 squares** so pieces feel like real chessmen instead of glyphs on a stripe.
- **Hover hints.** Put the cursor on one of your pieces and its legal moves show as muted dots — before you even commit to selecting it.
- **Always-on guidance line.** A one-line coach under the board tells you exactly what Enter will do right now ("↵ to pick up your bishop on c1", "↵ to move knight to f3", etc.).
- **`?` help overlay** with every shortcut grouped by intent. Any key dismisses.
- **Auto-tmux bootstrap.** `/chess` splits your current tmux pane if you're in tmux; if you're not, it opens a new Terminal window with a tmux session containing Claude Code *and* chess side-by-side — so the side-by-side experience is the default even for users who've never touched tmux.
- **Every game auto-saves.** Quit mid-game at any time; it shows up as "Continue" next launch.
- **Library** of every game you've played, with mini-board previews and resumable positions.
- **Five difficulty levels** from *Intern* (random moves) to *Grandmaster* (depth-4 search), backed by [`js-chess-engine`](https://www.npmjs.com/package/js-chess-engine).
- **Claude-Code-flavoured shimmer** — a ✦ glides across a row of dots while the engine thinks.
- **Outlined vs filled pieces.** Your pieces use the outlined glyphs (♙♘♗♖♕♔), Claude's use the filled ones (♟♞♝♜♛♚) — you can tell sides apart at a glance, like a real set.
- **Autosave blip** — a small `● saved` indicator flashes in the header after each move so you know nothing's been lost.
- **Move history, captured pieces, material balance, check highlight, last-move highlight.**

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

## Use with Claude Code

### Personal install (quickest — gives you `/chess` in any session)

```bash
mkdir -p ~/.claude/commands
cp commands/chess.md ~/.claude/commands/chess.md
```

Then open Claude Code and type:

```
/chess
```

No namespace, no plugin manager, just `/chess`. The command invokes the launcher under the hood.

### Plugin install (for sharing / teams)

Register this repo as a plugin marketplace, then install:

```bash
# Inside Claude Code:
/plugin marketplace add daxaur/claude-chess
/plugin install claude-chess@claude-chess
/reload-plugins
```

Skills are namespaced when installed as a plugin: `/claude-chess:chess`.

### Dev mode (one-off testing)

```bash
claude --plugin-dir ~/claude-chess
```

Then `/claude-chess:chess` is available for that session only.

### How the integration actually works

A TTY can only have one program in raw mode at a time — Claude Code is already that program. So the plugin uses **tmux** as a shared-surface mechanism: `/chess` shells out to `claude-chess-launch`, which picks the best surface available:

| Situation | What the launcher does |
|---|---|
| You're already inside tmux | Splits your current pane; chess opens to the right. |
| macOS, tmux installed, not yet in tmux | Opens a new Terminal.app window with a fresh tmux session. If `claude` is on PATH it pre-seeds the session with Claude Code + chess as two panes, so you get the side-by-side even though you weren't in tmux. |
| macOS, no tmux | Opens a new Terminal.app window running chess directly. Suggests installing tmux. |
| Linux/other with tmux | Starts a detached tmux session and prints the attach command. |
| Everything else | Prints a short helpful message and exits non-zero. |

The point: **type `/chess`, get chess next to Claude Code**, regardless of how you started your session.

```
 ┌──────────────── tmux window ────────────────┬──────────────────────┐
 │  $ claude                                   │  ✦  C L A U D E …    │
 │    ▸ edits src/game.ts                      │                      │
 │    ▸ running tests…                         │    a  b  c  d  e …   │
 │                                             │ 8  ♜  ♞  ♝  ♛  ♚ …   │
 │  (Claude Code pane)                         │  (claude-chess pane) │
 └─────────────────────────────────────────────┴──────────────────────┘
```

Switch focus with `ctrl-b ←/→`, zoom a pane with `ctrl-b z`.

**If you're not inside tmux**, the launcher gracefully falls back:

- **macOS**: opens a new Terminal.app window running chess (`osascript`).
- **Linux / Windows / everywhere else**: prints instructions to run `claude-chess` yourself in a second terminal.

### Why tmux and not a real in-process integration?

I researched the plugin surface properly — slash commands, skills, hooks, MCP servers, LSP, `bin/`, `settings.json`. None of them can render a custom UI or read keypresses; hooks explicitly document that they're [not connected to a TTY](https://code.claude.com/docs/en/hooks). True "inside Claude Code's own render tree" would require forking Claude Code (it's open source). Tmux is the best compromise that's actually shippable today.

## Controls

**Main menu**

| Key         | Action                             |
|-------------|------------------------------------|
| ↑ ↓         | Choose                             |
| Enter       | Select                             |
| q           | Quit                               |

**In-game**

| Key         | Action                             |
|-------------|------------------------------------|
| ← → ↑ ↓     | Move cursor                        |
| Enter / Space | Select piece / confirm move      |
| Esc         | Cancel selection                   |
| u           | Undo last ply-pair                 |
| r           | Resign                             |
| n           | New game                           |
| m           | Back to menu (game is saved)       |
| l           | Open library                       |
| `?` or `h`  | Full keybinding overlay            |
| q           | Quit (game is saved)               |

You never need to memorise any of this — `?` inside the game shows it all, and the status line under the board always spells out what Enter is about to do.

**Library**

| Key         | Action                             |
|-------------|------------------------------------|
| ↑ ↓         | Select game                        |
| Enter       | Open / resume                      |
| d           | Delete (confirm with `y`)          |
| Esc         | Back                               |

## Difficulty

| Level | Label       | Engine depth | Character                        |
|-------|-------------|--------------|----------------------------------|
| 1     | Intern      | 0            | Random-ish moves                 |
| 2     | Hobbyist    | 1            | Shallow search                   |
| 3     | Club player | 2            | Solid tactics                    |
| 4     | Expert      | 3            | Deep search, sharp play          |
| 5     | Grandmaster | 4            | Strongest setting                |

## Storage

Games live in `~/.claude/claude-chess/games/<id>.json` — one file per game, plain JSON, containing PGN + FEN + metadata. Safe to delete by hand, copy between machines, or inspect.

## Project layout

```
claude-chess/
├── .claude-plugin/plugin.json   # plugin metadata
├── commands/chess.md            # /chess slash command
├── skills/chess/SKILL.md        # modern skill form (Claude can auto-invoke)
├── bin/claude-chess.js          # CLI entry
└── src/
    ├── theme.js                 # palette, pieces, typography helpers
    ├── screen.js                # ANSI write buffer + exit handlers
    ├── input.js                 # raw-mode keyboard input
    ├── board.js                 # board renderer
    ├── sidebar.js               # right-hand panel
    ├── spinner.js               # shimmer animation
    ├── engine.js                # js-chess-engine wrapper
    ├── persistence.js           # GameStore + formatters
    ├── mainMenu.js              # New / Continue / Library / Quit
    ├── library.js               # saved-games browser
    ├── menu.js                  # difficulty picker
    ├── intro.js                 # pre-game ASCII animation
    └── game.js                  # main game loop
```

## License

MIT
