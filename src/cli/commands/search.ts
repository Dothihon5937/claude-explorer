/**
 * Search command
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ClaudeDataParser } from '../../core/parser.js';
import { SearchIndexer } from '../../core/indexer.js';
import { FilterEngine } from '../../core/filters.js';

export function searchCommand(program: Command, defaultDataPath: string) {
  program
    .command('search')
    .description('Search through conversations')
    .argument('<query>', 'Search query')
    .option('-p, --path <path>', 'Path to data directory', defaultDataPath)
    .option('-l, --limit <number>', 'Max results to show', '10')
    .option('--from <date>', 'Filter from date (YYYY-MM-DD)')
    .option('--to <date>', 'Filter to date (YYYY-MM-DD)')
    .option('--min-messages <number>', 'Minimum message count')
    .action(async (query: string, options) => {
      const spinner = ora('Loading data...').start();

      try {
        // Load data
        const parser = new ClaudeDataParser(options.path);
        await parser.load();

        // Apply filters
        const filterEngine = new FilterEngine();
        let conversations = parser.getConversationsWithMessages();

        if (options.from || options.to || options.minMessages) {
          conversations = filterEngine.filterConversations(conversations, {
            dateFrom: options.from ? new Date(options.from) : undefined,
            dateTo: options.to ? new Date(options.to) : undefined,
            minMessages: options.minMessages
              ? parseInt(options.minMessages)
              : undefined,
          });
        }

        spinner.text = 'Building search index...';
        const indexer = new SearchIndexer();
        indexer.buildIndex(conversations);

        spinner.text = 'Searching...';
        const results = indexer.search(query, parseInt(options.limit));

        spinner.succeed(
          `Found ${results.length} result${results.length !== 1 ? 's' : ''}`
        );

        // Display results
        results.forEach((result, idx) => {
          console.log(
            `\n${chalk.cyan(`${idx + 1}.`)} ${chalk.bold(result.conversation.name || 'Untitled')}`
          );
          console.log(
            `   ${chalk.gray('UUID:')} ${result.conversation.uuid}`
          );
          console.log(
            `   ${chalk.gray('Date:')} ${new Date(result.conversation.created_at).toLocaleDateString()}`
          );
          console.log(
            `   ${chalk.gray('Messages:')} ${result.conversation.chat_messages?.length || 0}`
          );
          console.log(
            `   ${chalk.gray('Score:')} ${result.score.toFixed(2)}`
          );

          if (result.matches.length > 0) {
            console.log(`   ${chalk.yellow('Matches:')}`);
            result.matches.slice(0, 2).forEach((match) => {
              console.log(
                `     ${chalk.gray(`Msg ${match.messageIndex + 1}:`)} ${match.snippet}`
              );
            });
          }
        });

        if (results.length === 0) {
          console.log(chalk.yellow('\nNo results found.'));
        }
      } catch (error) {
        spinner.fail('Search failed');
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}
