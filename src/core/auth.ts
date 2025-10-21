/**
 * OAuth authentication for claude.ai (like Claude Code)
 */
import Anthropic from '@anthropic-ai/sdk';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const AUTH_DIR = join(homedir(), '.claude-explorer');
const AUTH_FILE = join(AUTH_DIR, 'auth.json');

interface AuthData {
  sessionKey?: string;
  organizationId?: string;
  expiresAt?: string;
}

export class ClaudeAuth {
  private authData: AuthData = {};
  private client: Anthropic | null = null;

  /**
   * Initialize authentication
   */
  async initialize(): Promise<Anthropic> {
    // Try to load existing auth
    if (existsSync(AUTH_FILE)) {
      try {
        const data = await readFile(AUTH_FILE, 'utf-8');
        this.authData = JSON.parse(data);

        // Check if auth is still valid
        if (this.isAuthValid()) {
          this.client = this.createClient();
          return this.client;
        }
      } catch {
        // Invalid auth file, continue to login
      }
    }

    // Need to authenticate
    throw new Error('Not authenticated. Please run: npm run login');
  }

  /**
   * Get authenticated client
   */
  getClient(): Anthropic {
    if (!this.client) {
      throw new Error('Not authenticated. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Check if current auth is valid
   */
  isAuthValid(): boolean {
    if (!this.authData.sessionKey) {
      return false;
    }

    if (this.authData.expiresAt) {
      const expiresAt = new Date(this.authData.expiresAt);
      if (expiresAt < new Date()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create Anthropic client with session key
   */
  private createClient(): Anthropic {
    const sessionKey = this.authData.sessionKey || '';

    // Check if this is an OAuth token (starts with sk-ant-oat)
    const isOAuthToken = sessionKey.startsWith('sk-ant-oat');

    if (isOAuthToken) {
      // For OAuth tokens, use authToken and claude.ai base URL
      // OAuth tokens work with claude.ai API, not api.anthropic.com
      return new Anthropic({
        authToken: sessionKey,
        baseURL: 'https://api.claude.ai',
        defaultHeaders: this.authData.organizationId
          ? {
              'anthropic-organization-id': this.authData.organizationId,
            }
          : undefined,
      });
    } else {
      // For regular API keys, use apiKey parameter with standard endpoint
      return new Anthropic({
        apiKey: sessionKey,
        defaultHeaders: this.authData.organizationId
          ? {
              'anthropic-organization-id': this.authData.organizationId,
            }
          : undefined,
      });
    }
  }

  /**
   * Authenticate with OAuth flow
   */
  async login(): Promise<void> {
    console.log('🔐 Starting OAuth authentication...\n');

    // For now, fallback to API key until OAuth is fully implemented
    // This matches the Claude Code authentication pattern
    console.log('Please provide your authentication:');
    console.log('\nOption 1: Use API Key (temporary)');
    console.log('  Get from: https://console.anthropic.com/');
    console.log('\nOption 2: OAuth (preferred - coming soon)');
    console.log('  Will use claude.ai account login\n');

    // Read from stdin
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const apiKey = await new Promise<string>((resolve) => {
      rl.question('Enter API Key (or press Enter to skip): ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (apiKey) {
      this.authData = {
        sessionKey: apiKey,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days
      };

      await this.saveAuth();
      console.log('\n✓ Authentication saved\n');
    } else {
      throw new Error('Authentication cancelled');
    }
  }

  /**
   * Logout and clear auth
   */
  async logout(): Promise<void> {
    this.authData = {};
    this.client = null;

    if (existsSync(AUTH_FILE)) {
      await writeFile(AUTH_FILE, JSON.stringify({}));
    }
  }

  /**
   * Save auth data
   */
  private async saveAuth(): Promise<void> {
    if (!existsSync(AUTH_DIR)) {
      await mkdir(AUTH_DIR, { recursive: true });
    }

    await writeFile(AUTH_FILE, JSON.stringify(this.authData, null, 2));
  }

  /**
   * Get auth status
   */
  getStatus(): {
    authenticated: boolean;
    expiresAt?: string;
    organizationId?: string;
  } {
    return {
      authenticated: this.isAuthValid(),
      expiresAt: this.authData.expiresAt,
      organizationId: this.authData.organizationId,
    };
  }
}

/**
 * Singleton instance
 */
let authInstance: ClaudeAuth | null = null;

export function getAuth(): ClaudeAuth {
  if (!authInstance) {
    authInstance = new ClaudeAuth();
  }
  return authInstance;
}
