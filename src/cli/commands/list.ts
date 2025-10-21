/**
 * List command
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ClaudeDataParser } from '../../core/parser.js';
import { FilterEngine } from '../../core/filters.js';

export function listCommand(program: Command, defaultDataPath: string) {
  program
    .command('list')
    .description('List conversations or projects')
    .argument('[type]', 'Type to list: conversations or projects', 'conversations')
    .option('-p, --path <path>', 'Path to data directory', defaultDataPath)
    .option('-l, --limit <number>', 'Max items to show', '20')
    .option('--sort <field>', 'Sort by: date, messages, name', 'date')
    .option('--messages-only', 'Only show conversations with messages')
    .action(async (type: string, options) => {
      const spinner = ora('Loading data...').start();

      try {
        const parser = new ClaudeDataParser(options.path);
        await parser.load();

        const filterEngine = new FilterEngine();

        if (type === 'conversations' || type === 'conv') {
          let conversations = options.messagesOnly
            ? parser.getConversationsWithMessages()
            : parser.getConversations();

          // Sort
          conversations = filterEngine.sortConversations(
            conversations,
            options.sort as 'date' | 'messages' | 'name'
          );

          const limit = parseInt(options.limit);
          const display = conversations.slice(0, limit);

          spinner.succeed(
            `Showing ${display.length} of ${conversations.length} conversations`
          );

          display.forEach((conv, idx) => {
            console.log(
              `\n${chalk.cyan(`${idx + 1}.`)} ${chalk.bold(conv.name || 'Untitled')}`
            );
            console.log(`   ${chalk.gray('UUID:')} ${conv.uuid}`);
            console.log(
              `   ${chalk.gray('Date:')} ${new Date(conv.created_at).toLocaleDateString()}`
            );
            console.log(
              `   ${chalk.gray('Messages:')} ${conv.chat_messages?.length || 0}`
            );
          });
        } else if (type === 'projects' || type === 'proj') {
          const projects = parser.getProjects();
          const limit = parseInt(options.limit);
          const display = projects.slice(0, limit);

          spinner.succeed(
            `Showing ${display.length} of ${projects.length} projects`
          );

          display.forEach((proj, idx) => {
            console.log(
              `\n${chalk.cyan(`${idx + 1}.`)} ${chalk.bold(proj.name)}`
            );
            console.log(`   ${chalk.gray('UUID:')} ${proj.uuid}`);
            console.log(
              `   ${chalk.gray('Docs:')} ${proj.docs?.length || 0}`
            );
            console.log(
              `   ${chalk.gray('Description:')} ${proj.description.substring(0, 80)}${proj.description.length > 80 ? '...' : ''}`
            );
          });
        } else {
          spinner.fail('Invalid type');
          console.error(
            chalk.red('Error:'),
            'Type must be "conversations" or "projects"'
          );
          process.exit(1);
        }
      } catch (error) {
        spinner.fail('List failed');
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}
