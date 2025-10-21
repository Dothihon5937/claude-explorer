/**
 * Stats command
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ClaudeDataParser } from '../../core/parser.js';

export function statsCommand(program: Command, defaultDataPath: string) {
  program
    .command('stats')
    .description('Show statistics about exported data')
    .option('-p, --path <path>', 'Path to data directory', defaultDataPath)
    .action(async (options) => {
      const spinner = ora('Loading data...').start();

      try {
        const parser = new ClaudeDataParser(options.path);
        await parser.load();

        const stats = parser.getStats();

        spinner.succeed('Statistics loaded');

        console.log(chalk.bold('\n📊 Claude.ai Export Statistics\n'));

        console.log(chalk.cyan('Conversations:'));
        console.log(`  Total: ${stats.totalConversations}`);
        console.log(`  With messages: ${stats.conversationsWithMessages}`);
        console.log(
          `  Empty: ${stats.totalConversations - stats.conversationsWithMessages}`
        );

        console.log(chalk.cyan('\nMessages:'));
        console.log(`  Total: ${stats.messages.total}`);
        console.log(`  Average per conversation: ${stats.messages.avg.toFixed(1)}`);
        console.log(`  Min: ${stats.messages.min}`);
        console.log(`  Max: ${stats.messages.max}`);

        console.log(chalk.cyan('\nProjects:'));
        console.log(`  Total: ${stats.totalProjects}`);
        console.log(`  With docs: ${stats.projectsWithDocs}`);

        if (stats.dateRange) {
          console.log(chalk.cyan('\nDate Range:'));
          console.log(
            `  Earliest: ${new Date(stats.dateRange.earliest).toLocaleDateString()}`
          );
          console.log(
            `  Latest: ${new Date(stats.dateRange.latest).toLocaleDateString()}`
          );
        }

        console.log();
      } catch (error) {
        spinner.fail('Failed to load statistics');
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}
