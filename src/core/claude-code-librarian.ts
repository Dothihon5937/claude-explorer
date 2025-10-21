/**
 * Claude Code-based Librarian Agent
 * Uses Claude Code headless mode instead of Anthropic SDK
 */
import { ClaudeCodeClient } from './claude-code-client.js';
import { AgentTools } from './agent-tools.js';

export interface AgentResponse {
  message: string;
  success: boolean;
  error?: string;
}

export class ClaudeCodeLibrarian {
  private claudeClient: ClaudeCodeClient;
  private tools: AgentTools;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  // Response caching
  private cache = new Map<string, { response: string; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 50;

  constructor(dataPath: string, claudeCommand: string = 'claude') {
    this.claudeClient = new ClaudeCodeClient(claudeCommand);
    this.tools = new AgentTools(dataPath);
  }

  /**
   * Initialize the librarian
   */
  async initialize(): Promise<void> {
    await this.tools.initialize();

    // Check if Claude Code is available
    const isAvailable = await this.claudeClient.isAvailable();
    if (!isAvailable) {
      throw new Error(
        'Claude Code is not available. Please ensure Claude Code is installed and accessible via PATH.'
      );
    }
  }

  /**
   * Process a user message
   */
  async chat(userMessage: string): Promise<AgentResponse> {
    try {
      // Generate cache key from message
      const cacheKey = this.hashMessage(userMessage);

      // Check cache
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        // Return cached response
        return {
          success: true,
          message: cached.response,
        };
      }

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Build context from conversation data
      const context = await this.buildContext(userMessage);

      // Create full prompt with system instructions
      const fullPrompt = this.buildPrompt(userMessage, context);

      // Execute via Claude Code
      const response = await this.claudeClient.executePromptStdin(fullPrompt);

      if (response.success) {
        // Add assistant response to history
        this.conversationHistory.push({
          role: 'assistant',
          content: response.message,
        });

        // Cache the response
        this.cacheResponse(cacheKey, response.message);

        return {
          success: true,
          message: response.message,
        };
      } else {
        return {
          success: false,
          message: '',
          error: response.error || 'Unknown error from Claude Code',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build context from conversation data based on user query
   */
  private async buildContext(userMessage: string): Promise<string> {
    const contextParts: string[] = [];

    // Extract search terms from the message
    const searchTerms = this.extractSearchTerms(userMessage);

    if (searchTerms.length > 0) {
      // Search for relevant conversations
      const searchResult = await this.tools.searchConversations({
        query: searchTerms.join(' '),
        limit: 10,
      });

      if (searchResult.success && searchResult.data) {
        contextParts.push('# Relevant Conversations Found:');
        contextParts.push('');
        contextParts.push(JSON.stringify(searchResult.data, null, 2));
        contextParts.push('');
      }
    }

    // Add statistics
    const stats = await this.tools.getStats();
    if (stats.success && stats.data) {
      contextParts.push('# Data Statistics:');
      contextParts.push(JSON.stringify(stats.data, null, 2));
      contextParts.push('');
    }

    return contextParts.join('\n');
  }

  /**
   * Build full prompt with system instructions
   */
  private buildPrompt(userMessage: string, context: string): string {
    const systemPrompt = `You are an AI librarian assistant helping to explore and analyze Claude.ai conversation exports.

You have access to conversation data and can help users:
- Search for specific conversations by topic, date, or content
- Provide details about conversations
- Export conversations in various formats (Markdown, JSON, ZIP)
- Create knowledge bases from multiple conversations
- Analyze patterns and topics across conversations
- Help package context for uploading to Claude Projects

When helping users:
1. Be conversational and helpful
2. Ask clarifying questions if needed
3. Provide clear, actionable responses
4. Reference specific conversations by UUID when relevant
5. Suggest useful next steps

${context ? '# Context Data:\n\n' + context + '\n\n' : ''}`;

    // Include recent conversation history for context
    const historyContext =
      this.conversationHistory.length > 0
        ? '\n# Recent Conversation:\n' +
          this.conversationHistory
            .slice(-4)
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join('\n') +
          '\n\n'
        : '';

    return `${systemPrompt}${historyContext}User: ${userMessage}`;
  }

  /**
   * Extract search terms from user message
   */
  private extractSearchTerms(message: string): string[] {
    // Simple extraction - look for quoted strings and important keywords
    const terms: string[] = [];

    // Extract quoted strings
    const quoted = message.match(/"([^"]+)"/g);
    if (quoted) {
      terms.push(...quoted.map((q) => q.replace(/"/g, '')));
    }

    // Extract topic keywords
    const topicKeywords = [
      'React',
      'TypeScript',
      'JavaScript',
      'Python',
      'authentication',
      'API',
      'database',
      'Docker',
      'Kubernetes',
      'AWS',
      'Azure',
      'deployment',
      'testing',
      'bug',
      'feature',
      'refactor',
      'optimization',
    ];

    const lowerMessage = message.toLowerCase();
    for (const keyword of topicKeywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        terms.push(keyword);
      }
    }

    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Hash a message for cache key
   */
  private hashMessage(message: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Cache a response with LRU eviction
   */
  private cacheResponse(key: string, response: string): void {
    // Implement LRU: if cache is full, remove oldest entry
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Add to cache
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if Claude Code is available
   */
  async isAvailable(): Promise<boolean> {
    return await this.claudeClient.isAvailable();
  }
}
