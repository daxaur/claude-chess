#!/usr/bin/env node
import chalk from 'chalk';
import { C, EMBLEM, CLEAR, SHOW } from '../src/theme.js';
import { playIntro } from '../src/intro.js';
import { mainMenu } from '../src/mainMenu.js';
import { libraryScreen } from '../src/library.js';
import { selectDifficulty } from '../src/menu.js';
import { runGame } from '../src/game.js';
import { installExitHandlers } from '../src/screen.js';
import { GameStore } from '../src/persistence.js';

const bye = installExitHandlers();
const store = new GameStore();

function printFarewell() {
  process.stdout.write(CLEAR + SHOW);
  console.log();
  console.log('  ' + chalk.hex(C.accent).bold(EMBLEM + '  thanks for playing'));
  console.log();
}

function printOutcome(outcome) {
  if (!outcome || outcome.kind === 'quit') return;
  if (outcome.kind === 'menu' || outcome.kind === 'newgame' || outcome.kind === 'library') return;
  const msg = outcome.message ?? outcome.kind;
  process.stdout.write(CLEAR);
  console.log();
  console.log('  ' + chalk.hex(C.accent).bold(EMBLEM + '  ' + msg));
  console.log();
}

async function main() {
  if (!process.stdin.isTTY) {
    console.error('claude-chess must be run in an interactive terminal (TTY required).');
    process.exit(1);
  }

  const skipIntro = process.argv.includes('--no-intro');
  if (!skipIntro) {
    try { await playIntro(); } catch { /* intro is optional */ }
  }

  let lastLevel = 3;
  let nextAction = { kind: 'menu' };

  while (true) {
    if (nextAction.kind === 'menu') {
      const action = await mainMenu(store);
      if (action.kind === 'quit') break;
      if (action.kind === 'new') {
        const difficulty = await selectDifficulty(lastLevel);
        if (difficulty == null) { nextAction = { kind: 'menu' }; continue; }
        lastLevel = difficulty;
        const record = store.create({ difficulty });
        nextAction = { kind: 'play', record };
      } else if (action.kind === 'continue') {
        if (!action.record) { nextAction = { kind: 'menu' }; continue; }
        lastLevel = action.record.difficulty;
        nextAction = { kind: 'play', record: action.record };
      } else if (action.kind === 'library') {
        nextAction = { kind: 'library' };
      }
      continue;
    }

    if (nextAction.kind === 'library') {
      const libAction = await libraryScreen(store);
      if (libAction.kind === 'back') { nextAction = { kind: 'menu' }; continue; }
      if (libAction.kind === 'open') {
        lastLevel = libAction.record.difficulty;
        // Opening a finished game replays it read-only-ish: we still drop into
        // runGame, where the user sees the final position and can press `n`
        // for a new game or `m` to go back to the menu.
        nextAction = { kind: 'play', record: libAction.record };
      }
      continue;
    }

    if (nextAction.kind === 'play') {
      const outcome = await runGame({ store, record: nextAction.record });
      printOutcome(outcome);
      if (outcome.kind === 'quit')    break;
      if (outcome.kind === 'menu')    { nextAction = { kind: 'menu' };    continue; }
      if (outcome.kind === 'library') { nextAction = { kind: 'library' }; continue; }
      if (outcome.kind === 'newgame') {
        const difficulty = await selectDifficulty(lastLevel);
        if (difficulty == null) { nextAction = { kind: 'menu' }; continue; }
        lastLevel = difficulty;
        const record = store.create({ difficulty });
        nextAction = { kind: 'play', record };
        continue;
      }
      // Default: loop to menu.
      nextAction = { kind: 'menu' };
    }
  }

  printFarewell();
  bye(0);
}

main().catch((err) => {
  process.stdout.write(SHOW);
  console.error(err);
  bye(1);
});
