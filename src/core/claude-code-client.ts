/**
 * Claude Code Headless Client
 * Wraps Claude Code CLI for headless usage
 */
import { spawn } from 'child_process';

export interface ClaudeCodeResponse {
  message: string;
  success: boolean;
  error?: string;
}

export class ClaudeCodeClient {
  private claudeCommand: string;

  constructor(claudeCommand: string = 'claude') {
    // On Windows, use claude.cmd instead of just claude
    if (process.platform === 'win32' && !claudeCommand.includes('.')) {
      this.claudeCommand = `${claudeCommand}.cmd`;
    } else {
      this.claudeCommand = claudeCommand;
    }
  }

  /**
   * Check if Claude Code is available
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;

      // On Windows, .cmd files require shell: true
      // This is safe here since we control all arguments
      const process = spawn(this.claudeCommand, ['--version'], {
        stdio: 'pipe',
        shell: true,
      });

      process.on('error', () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });

      process.on('exit', (code) => {
        if (!resolved) {
          resolved = true;
          resolve(code === 0);
        }
      });

      // Longer timeout for Windows
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          process.kill();
          resolve(false);
        }
      }, 10000);
    });
  }

  /**
   * Execute a prompt using Claude Code print mode
   */
  async executePrompt(
    prompt: string,
    context?: string
  ): Promise<ClaudeCodeResponse> {
    try {
      let fullPrompt = prompt;
      if (context) {
        fullPrompt = `${context}\n\n---\n\nUser Query: ${prompt}`;
      }

      // Execute Claude Code in print mode (pipe-friendly)
      const response = await this.spawnClaudePrint(fullPrompt);

      return response;
    } catch (error) {
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Spawn Claude Code process in print mode and capture output
   */
  private async spawnClaudePrint(
    prompt: string
  ): Promise<ClaudeCodeResponse> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      // Spawn claude with --print flag for non-interactive mode
      // Pass prompt via stdin instead of command-line argument
      // On Windows, .cmd files require shell: true
      // This is safe since we control all arguments; user input goes via stdin
      const process = spawn(
        this.claudeCommand,
        [
          '--print',
          '--output-format', 'text',
          '--dangerously-skip-permissions'  // Skip permission prompts for automation
        ],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
        }
      );

      // Write prompt to stdin and close it
      if (process.stdin) {
        process.stdin.write(prompt);
        process.stdin.end();
      }

      // Capture stdout
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      // Capture stderr
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process exit
      process.on('exit', (code) => {
        if (code === 0 && stdout) {
          resolve({
            success: true,
            message: this.parseClaudeOutput(stdout),
          });
        } else {
          resolve({
            success: false,
            message: '',
            error: stderr || `Process exited with code ${code}`,
          });
        }
      });

      // Handle process errors
      process.on('error', (error) => {
        reject(error);
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        process.kill();
        reject(new Error('Claude Code process timed out'));
      }, 120000);
    });
  }

  /**
   * Parse Claude's output to extract the actual response
   */
  private parseClaudeOutput(output: string): string {
    // Claude Code may include some metadata or formatting
    // Extract the actual response content

    // Remove common CLI artifacts
    let cleaned = output
      .replace(/^\s*claude>\s*/gm, '') // Remove prompts
      .replace(/^Loading\.\.\.\s*/gm, '') // Remove loading messages
      .replace(/^Thinking\.\.\.\s*/gm, '') // Remove thinking messages
      .trim();

    return cleaned;
  }

  /**
   * Execute a prompt using stdin pipe (alternative method)
   */
  async executePromptStdin(
    prompt: string,
    context?: string
  ): Promise<ClaudeCodeResponse> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const fullPrompt = context
        ? `${context}\n\n---\n\nUser Query: ${prompt}`
        : prompt;

      // Spawn claude with --print flag for pipe mode
      // On Windows, .cmd files require shell: true
      const process = spawn(this.claudeCommand, [
        '--print',
        '--output-format', 'text',
        '--dangerously-skip-permissions'
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      // Send prompt to stdin
      process.stdin?.write(fullPrompt);
      process.stdin?.end();

      // Capture stdout
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      // Capture stderr
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process exit
      process.on('exit', (code) => {
        if (code === 0 && stdout) {
          resolve({
            success: true,
            message: this.parseClaudeOutput(stdout),
          });
        } else {
          resolve({
            success: false,
            message: '',
            error: stderr || `Process exited with code ${code}`,
          });
        }
      });

      // Handle process errors
      process.on('error', (error) => {
        reject(error);
      });

      // Timeout
      setTimeout(() => {
        process.kill();
        reject(new Error('Claude Code process timed out'));
      }, 120000);
    });
  }
}
