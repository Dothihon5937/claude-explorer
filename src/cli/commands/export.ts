/**
 * Export command
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile } from 'fs/promises';
import { ClaudeDataParser } from '../../core/parser.js';
import { MarkdownExporter } from '../../core/exporters/markdown.js';
import { JSONExporter } from '../../core/exporters/json.js';
import { BundleExporter } from '../../core/exporters/bundle.js';

export function exportCommand(program: Command, defaultDataPath: string) {
  program
    .command('export')
    .description('Export conversation or project')
    .argument('<uuid>', 'UUID of conversation or project to export')
    .option('-p, --path <path>', 'Path to data directory', defaultDataPath)
    .option(
      '-f, --format <format>',
      'Export format: markdown, json, bundle',
      'markdown'
    )
    .option('-o, --output <file>', 'Output file path')
    .option('-t, --type <type>', 'Type: conversation or project', 'conversation')
    .action(async (uuid: string, options) => {
      const spinner = ora('Loading data...').start();

      try {
        const parser = new ClaudeDataParser(options.path);
        await parser.load();

        if (options.type === 'conversation' || options.type === 'conv') {
          const conversation = parser.getConversation(uuid);
          if (!conversation) {
            spinner.fail('Conversation not found');
            console.error(chalk.red('Error:'), `No conversation with UUID: ${uuid}`);
            process.exit(1);
          }

          spinner.text = 'Exporting...';

          const safeName = (conversation.name || 'conversation')
            .replace(/[^a-z0-9-_]/gi, '_')
            .substring(0, 50);

          let outputPath = options.output;
          let content: string;

          switch (options.format) {
            case 'markdown':
            case 'md': {
              if (!outputPath) outputPath = `${safeName}.md`;
              const exporter = new MarkdownExporter();
              content = exporter.exportConversation(conversation);
              await writeFile(outputPath, content, 'utf-8');
              break;
            }

            case 'json': {
              if (!outputPath) outputPath = `${safeName}.json`;
              const exporter = new JSONExporter();
              content = exporter.exportConversation(conversation, {
                format: 'json',
                includeMetadata: true,
              });
              await writeFile(outputPath, content, 'utf-8');
              break;
            }

            case 'bundle':
            case 'zip': {
              if (!outputPath) outputPath = `${safeName}.zip`;
              const exporter = new BundleExporter();
              await exporter.exportConversationBundle(conversation, outputPath);
              break;
            }

            default:
              spinner.fail('Invalid format');
              console.error(
                chalk.red('Error:'),
                'Format must be markdown, json, or bundle'
              );
              process.exit(1);
          }

          spinner.succeed(`Exported to ${chalk.green(outputPath)}`);
        } else if (options.type === 'project' || options.type === 'proj') {
          const project = parser.getProject(uuid);
          if (!project) {
            spinner.fail('Project not found');
            console.error(chalk.red('Error:'), `No project with UUID: ${uuid}`);
            process.exit(1);
          }

          spinner.text = 'Exporting...';

          const safeName = project.name
            .replace(/[^a-z0-9-_]/gi, '_')
            .substring(0, 50);

          let outputPath = options.output;

          switch (options.format) {
            case 'markdown':
            case 'md': {
              if (!outputPath) outputPath = `${safeName}.md`;
              const exporter = new MarkdownExporter();
              const content = exporter.exportProject(project);
              await writeFile(outputPath, content, 'utf-8');
              break;
            }

            case 'json': {
              if (!outputPath) outputPath = `${safeName}.json`;
              const exporter = new JSONExporter();
              const content = exporter.exportProject(project);
              await writeFile(outputPath, content, 'utf-8');
              break;
            }

            case 'bundle':
            case 'zip': {
              if (!outputPath) outputPath = `${safeName}.zip`;
              const exporter = new BundleExporter();
              await exporter.exportProjectBundle(project, outputPath);
              break;
            }

            default:
              spinner.fail('Invalid format');
              console.error(
                chalk.red('Error:'),
                'Format must be markdown, json, or bundle'
              );
              process.exit(1);
          }

          spinner.succeed(`Exported to ${chalk.green(outputPath)}`);
        } else {
          spinner.fail('Invalid type');
          console.error(
            chalk.red('Error:'),
            'Type must be "conversation" or "project"'
          );
          process.exit(1);
        }
      } catch (error) {
        spinner.fail('Export failed');
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}
