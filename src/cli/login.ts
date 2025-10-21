#!/usr/bin/env node

/**
 * Login CLI for OAuth authentication
 */
import chalk from 'chalk';
import { getAuth } from '../core/auth.js';

async function main() {
  console.log(chalk.cyan.bold('\n🔐 Claude Explorer Authentication\n'));

  const auth = getAuth();

  // Check current status
  const status = auth.getStatus();

  if (status.authenticated) {
    console.log(chalk.green('✓ Already authenticated'));
    if (status.expiresAt) {
      console.log(
        chalk.gray(
          `  Expires: ${new Date(status.expiresAt).toLocaleString()}`
        )
      );
    }
    if (status.organizationId) {
      console.log(chalk.gray(`  Organization: ${status.organizationId}`));
    }

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('\nRe-authenticate? (y/N): ', (ans) => {
        rl.close();
        resolve(ans.trim().toLowerCase());
      });
    });

    if (answer !== 'y' && answer !== 'yes') {
      console.log(chalk.gray('\nKeeping existing authentication.\n'));
      return;
    }

    await auth.logout();
  }

  // Perform login
  try {
    await auth.login();
    console.log(chalk.green('\n✓ Authentication successful!\n'));
    console.log(chalk.gray('You can now use: npm run chat\n'));
  } catch (error) {
    console.error(
      chalk.red('\n❌ Authentication failed:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Error:'), error);
  process.exit(1);
});
