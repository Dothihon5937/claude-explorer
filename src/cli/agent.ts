#!/usr/bin/env node

/**
 * Interactive AI Librarian CLI
 */
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { LibrarianAgent } from '../core/librarian-agent.js';
import { getAuth } from '../core/auth.js';
import { getModelSelector } from '../core/models.js';

const DATA_DIR = join(process.env.HOME || process.env.USERPROFILE || '', '.claude-explorer');
const SESSION_FILE = join(DATA_DIR, 'session.json');

interface SessionData {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  timestamp: string;
}

/**
 * Main agent CLI
 */
async function main() {
  console.log(chalk.cyan.bold('\n🤖 Claude Explorer AI Librarian\n'));
  console.log(chalk.gray('An intelligent assistant for your Claude conversation history\n'));

  // Get data path
  const dataPath = process.argv[2] || process.cwd();

  // Initialize authentication
  const auth = getAuth();
  let client;

  try {
    client = await auth.initialize();
    console.log(chalk.green('✓ Authenticated\n'));
  } catch {
    console.log(
      chalk.yellow('⚠ Not authenticated. Please run: npm run login\n')
    );
    console.log(chalk.gray('For now, you can also:'));
    console.log(chalk.gray('  1. Get an API key from https://console.anthropic.com/'));
    console.log(chalk.gray('  2. Run: npm run login'));
    console.log(chalk.gray('  3. Enter your API key when prompted\n'));
    process.exit(1);
  }

  // Show model info
  const modelSelector = getModelSelector();
  const models = modelSelector.compareModels();
  console.log(chalk.cyan('📊 Available Models:\n'));
  models.forEach((m) => {
    console.log(chalk.gray(`  ${m.model}: ${m.description}`));
    console.log(chalk.gray(`    Speed: ${m.speed} | Cost: ${m.cost}`));
    console.log(chalk.gray(`    Best for: ${m.bestFor}\n`));
  });

  // Initialize agent
  const spinner = ora('Initializing AI librarian...').start();
  const agent = new LibrarianAgent(client, dataPath);

  try {
    await agent.initialize();
    spinner.succeed('AI librarian ready!');
  } catch (error) {
    spinner.fail('Failed to initialize');
    console.error(
      chalk.red('Error:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }

  // Try to load previous session
  if (existsSync(SESSION_FILE)) {
    try {
      const sessionData: SessionData = JSON.parse(
        await readFile(SESSION_FILE, 'utf-8')
      );
      agent.loadHistory(sessionData.history);
      console.log(
        chalk.green(
          `\n✓ Restored session from ${new Date(sessionData.timestamp).toLocaleString()}`
        )
      );
    } catch {
      // Ignore session load errors
    }
  }

  // Show help
  console.log(chalk.gray('\nWhat would you like to know about your conversations?'));
  console.log(chalk.gray('Examples:'));
  console.log(chalk.gray('  - "Find conversations about React authentication"'));
  console.log(chalk.gray('  - "Show me my most active conversations"'));
  console.log(chalk.gray('  - "Export conversations about database design to markdown"'));
  console.log(chalk.gray('  - "Create a knowledge base about my API projects"'));
  console.log(
    chalk.gray('\nCommands: /help, /stats, /reset, /save, /quit\n')
  );

  // Create readline interface
  const rl = createInterface({ input, output });

  let running = true;

  while (running) {
    try {
      const userInput = await rl.question(chalk.cyan('You: '));

      if (!userInput.trim()) continue;

      // Handle special commands
      if (userInput.startsWith('/')) {
        const handled = await handleCommand(userInput, agent);
        if (handled === 'quit') {
          running = false;
        }
        continue;
      }

      // Process with agent (streaming)
      process.stdout.write(chalk.green('\nAssistant: '));

      const streamSpinner = ora({ text: '', spinner: 'dots' }).start();

      try {
        let response = '';
        const stream = agent.chatStream(userInput);

        for await (const chunk of stream) {
          streamSpinner.stop();
          process.stdout.write(chalk.green(chunk));
          response += chunk;
        }

        console.log('\n');
      } catch (error) {
        streamSpinner.fail();
        console.error(
          chalk.red('\nError:'),
          error instanceof Error ? error.message : String(error)
        );
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ERR_USE_AFTER_CLOSE') {
        // Readline closed, exit gracefully
        break;
      }
      throw error;
    }
  }

  // Save session before exit
  await saveSession(agent);

  rl.close();
  console.log(chalk.cyan('\n👋 Goodbye!\n'));
}

/**
 * Handle special commands
 */
async function handleCommand(
  command: string,
  agent: LibrarianAgent
): Promise<string | void> {
  const cmd = command.toLowerCase().trim();

  switch (cmd) {
    case '/help':
      console.log(chalk.yellow('\n📚 Available Commands:\n'));
      console.log(chalk.gray('  /help     - Show this help message'));
      console.log(chalk.gray('  /stats    - Show data statistics'));
      console.log(chalk.gray('  /reset    - Reset conversation history'));
      console.log(chalk.gray('  /save     - Save current session'));
      console.log(chalk.gray('  /quit     - Exit the librarian\n'));
      console.log(chalk.yellow('💡 Tips:\n'));
      console.log(chalk.gray('  - Ask questions in natural language'));
      console.log(chalk.gray('  - Request exports, searches, or summaries'));
      console.log(
        chalk.gray('  - Reference conversations by UUID from search results\n')
      );
      break;

    case '/stats': {
      const spinner = ora('Loading statistics...').start();
      try {
        const result = await agent.tools.getStats();
        spinner.succeed('Statistics loaded');

        if (result.success && result.data) {
          const stats = result.data as ReturnType<typeof import('../core/parser.js').ClaudeDataParser.prototype.getStats>;
          console.log(chalk.cyan('\n📊 Data Statistics:\n'));
          console.log(chalk.gray(`  Total conversations: ${stats.totalConversations}`));
          console.log(chalk.gray(`  With messages: ${stats.conversationsWithMessages}`));
          console.log(chalk.gray(`  Total messages: ${stats.messages.total}`));
          console.log(chalk.gray(`  Average per conversation: ${stats.messages.avg.toFixed(1)}`));
          console.log(chalk.gray(`  Projects: ${stats.totalProjects}\n`));
        }
      } catch (error) {
        spinner.fail('Failed to load statistics');
      }
      break;
    }

    case '/reset':
      agent.resetHistory();
      console.log(chalk.yellow('\n✓ Conversation history reset\n'));
      break;

    case '/save':
      await saveSession(agent);
      console.log(chalk.green('\n✓ Session saved\n'));
      break;

    case '/quit':
    case '/exit':
      return 'quit';

    default:
      console.log(chalk.red(`\n❌ Unknown command: ${command}`));
      console.log(chalk.gray('Type /help for available commands\n'));
  }
}

/**
 * Save current session
 */
async function saveSession(agent: LibrarianAgent): Promise<void> {
  try {
    // Ensure directory exists
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    const sessionData: SessionData = {
      history: agent.getHistory(),
      timestamp: new Date().toISOString(),
    };

    await writeFile(SESSION_FILE, JSON.stringify(sessionData, null, 2));
  } catch (error) {
    // Silently fail - not critical
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  main().catch((error) => {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    process.exit(1);
  });
}
