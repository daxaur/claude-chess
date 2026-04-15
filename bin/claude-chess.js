#!/usr/bin/env node
import chalk from 'chalk';
import { C, CLEAR, SHOW } from '../src/theme.js';
import { playIntro } from '../src/intro.js';
import { selectDifficulty } from '../src/menu.js';
import { runGame } from '../src/game.js';
import { installExitHandlers } from '../src/screen.js';

const bye = installExitHandlers();

function printOutcome(outcome) {
  if (!outcome || outcome.kind === 'quit') return;
  const msg =
    outcome.message ??
    (outcome.kind === 'newgame' ? 'starting a new game…' : outcome.kind);
  process.stdout.write(CLEAR);
  console.log();
  console.log('  ' + chalk.hex(C.accent).bold('♔  ' + msg));
  console.log();
}

async function main() {
  // Require a TTY — the whole app is built around raw-mode input.
  if (!process.stdin.isTTY) {
    console.error(
      'claude-chess must be run in an interactive terminal (TTY required).'
    );
    process.exit(1);
  }

  const skipIntro = process.argv.includes('--no-intro');
  if (!skipIntro) {
    try {
      await playIntro();
    } catch {
      // Intro is cosmetic — never block the game on it.
    }
  }

  let lastLevel = 3;
  while (true) {
    const difficulty = await selectDifficulty(lastLevel);
    if (difficulty == null) break;
    lastLevel = difficulty;

    const outcome = await runGame({ difficulty });
    printOutcome(outcome);

    if (outcome.kind === 'quit') break;
    // On 'newgame', 'checkmate', 'stalemate', etc. we loop to the menu.
  }

  process.stdout.write(CLEAR + SHOW);
  console.log(chalk.hex(C.accent)('  thanks for playing ♔'));
  bye(0);
}

main().catch((err) => {
  process.stdout.write(SHOW);
  console.error(err);
  bye(1);
});
