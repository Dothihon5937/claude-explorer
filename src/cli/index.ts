#!/usr/bin/env node

/**
 * CLI entry point for Claude Explorer
 */
import { Command } from 'commander';
import { searchCommand } from './commands/search.js';
import { listCommand } from './commands/list.js';
import { exportCommand } from './commands/export.js';
import { statsCommand } from './commands/stats.js';

const program = new Command();

program
  .name('claude-explorer')
  .description('Parser, viewer, and context extractor for Claude.ai export data')
  .version('1.0.0');

// Default data path (current directory)
const defaultDataPath = process.cwd();

// Register commands
searchCommand(program, defaultDataPath);
listCommand(program, defaultDataPath);
exportCommand(program, defaultDataPath);
statsCommand(program, defaultDataPath);

// Parse arguments
program.parse();
