#!/usr/bin/env node
import { Command } from 'commander';
import { createInitCommand } from './cli/commands/init';
import { createGenerateCommand } from './cli/commands/generate';
import { createCleanCommand } from './cli/commands/clean';
import { version } from '../package.json';
import { testgenAsciiArt } from './utils/ascii-art';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Display ASCII art
  console.log('\x1b[36m%s\x1b[0m', testgenAsciiArt); // Cyan color

  const program = new Command()
    .name('testgen')
    .description('AI-powered test generator for JavaScript/TypeScript projects')
    .version(version);

  // Add commands
  program.addCommand(createInitCommand());
  program.addCommand(createGenerateCommand());
  program.addCommand(createCleanCommand());

  // Parse command line arguments
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(
    'Error:',
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
