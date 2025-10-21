/**
 * Agent tools for AI-powered librarian
 */
import { ClaudeDataParser } from './parser.js';
import { FuzzySearchEngine } from './fuzzy-search.js';
import { FilterEngine } from './filters.js';
import { ContextExtractor } from './context-extractor.js';
import { MarkdownExporter } from './exporters/markdown.js';
import { Conversation } from './types.js';

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

export class AgentTools {
  private parser: ClaudeDataParser;
  private fuzzySearch: FuzzySearchEngine;
  private filterEngine: FilterEngine;
  private contextExtractor: ContextExtractor;
  private markdownExporter: MarkdownExporter;

  constructor(dataPath: string) {
    this.parser = new ClaudeDataParser(dataPath);
    this.fuzzySearch = new FuzzySearchEngine();
    this.filterEngine = new FilterEngine();
    this.contextExtractor = new ContextExtractor();
    this.markdownExporter = new MarkdownExporter();
  }

  /**
   * Initialize - load data and build indices
   */
  async initialize(): Promise<void> {
    await this.parser.load();
    const conversations = this.parser.getConversationsWithMessages();
    const projects = this.parser.getProjects();
    this.fuzzySearch.buildIndices(conversations, projects);
  }

  /**
   * Search conversations with natural language
   */
  async searchConversations(params: {
    query: string;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    minMessages?: number;
    hasCode?: boolean;
  }): Promise<ToolResult> {
    try {
      const conversations = this.parser.getConversationsWithMessages();

      // Use fuzzy search for better matching
      let results = this.fuzzySearch.advancedSearch({
        query: params.query,
        hasCode: params.hasCode,
        minMessages: params.minMessages,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        conversations,
      });

      // Limit results
      const limit = params.limit || 10;
      results = results.slice(0, limit);

      // Format results
      const formatted = results.map((conv) => ({
        uuid: conv.uuid,
        name: conv.name || 'Untitled',
        date: new Date(conv.created_at).toLocaleDateString(),
        messages: conv.chat_messages?.length || 0,
        summary: conv.summary || this.generateQuickSummary(conv),
      }));

      return {
        success: true,
        data: formatted,
        message: `Found ${formatted.length} conversation(s)`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Get detailed information about a conversation
   */
  async getConversationDetails(params: {
    uuid: string;
  }): Promise<ToolResult> {
    try {
      const conversation = this.parser.getConversation(params.uuid);
      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found',
        };
      }

      // Extract context
      const context = this.contextExtractor.extractContext(conversation);

      return {
        success: true,
        data: {
          uuid: conversation.uuid,
          name: conversation.name,
          created: new Date(conversation.created_at).toLocaleString(),
          updated: new Date(conversation.updated_at).toLocaleString(),
          messageCount: conversation.chat_messages?.length || 0,
          summary: conversation.summary,
          topics: context.topics,
          codeSnippets: context.codeSnippets.length,
          keyDecisions: context.keyDecisions,
          actionItems: context.actionItems,
        },
        message: 'Retrieved conversation details',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get details',
      };
    }
  }

  /**
   * Get statistics about the data
   */
  async getStats(): Promise<ToolResult> {
    try {
      const stats = this.parser.getStats();
      return {
        success: true,
        data: stats,
        message: 'Retrieved statistics',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      };
    }
  }

  /**
   * List recent conversations
   */
  async listRecentConversations(params: {
    limit?: number;
    sort?: 'date' | 'messages';
  }): Promise<ToolResult> {
    try {
      const conversations = this.parser.getConversationsWithMessages();
      const sorted = this.filterEngine.sortConversations(
        conversations,
        params.sort || 'date'
      );

      const limit = params.limit || 20;
      const results = sorted.slice(0, limit).map((conv) => ({
        uuid: conv.uuid,
        name: conv.name || 'Untitled',
        date: new Date(conv.created_at).toLocaleDateString(),
        messages: conv.chat_messages?.length || 0,
      }));

      return {
        success: true,
        data: results,
        message: `Listed ${results.length} conversation(s)`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list',
      };
    }
  }

  /**
   * Export conversation as markdown
   */
  async exportToMarkdown(params: { uuid: string }): Promise<ToolResult> {
    try {
      const conversation = this.parser.getConversation(params.uuid);
      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found',
        };
      }

      const markdown = this.markdownExporter.exportConversation(conversation);

      return {
        success: true,
        data: { markdown, filename: this.generateFilename(conversation) },
        message: 'Exported to markdown',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Create a knowledge base from multiple conversations
   */
  async createKnowledgeBase(params: {
    uuids: string[];
    title: string;
    description?: string;
  }): Promise<ToolResult> {
    try {
      const conversations = params.uuids
        .map((uuid) => this.parser.getConversation(uuid))
        .filter((c): c is Conversation => c !== undefined);

      if (conversations.length === 0) {
        return {
          success: false,
          error: 'No conversations found',
        };
      }

      const markdown = this.markdownExporter.exportAsKnowledgeBase(
        conversations,
        params.title,
        params.description
      );

      return {
        success: true,
        data: {
          markdown,
          conversationCount: conversations.length,
          filename: `${this.sanitizeFilename(params.title)}.md`,
        },
        message: `Created knowledge base with ${conversations.length} conversation(s)`,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create knowledge base',
      };
    }
  }

  /**
   * Find conversations by topic
   */
  async findByTopic(params: { topic: string; limit?: number }): Promise<ToolResult> {
    try {
      const conversations = this.parser.getConversationsWithMessages();

      const results = this.fuzzySearch.advancedSearch({
        query: params.topic,
        conversations,
      });

      const limit = params.limit || 10;
      const formatted = results.slice(0, limit).map((conv) => ({
        uuid: conv.uuid,
        name: conv.name || 'Untitled',
        date: new Date(conv.created_at).toLocaleDateString(),
        messages: conv.chat_messages?.length || 0,
        relevance: 'high', // Could calculate this based on fuzzy score
      }));

      return {
        success: true,
        data: formatted,
        message: `Found ${formatted.length} conversation(s) about "${params.topic}"`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Get all available tools definition for Claude
   */
  static getToolsDefinition() {
    return [
      {
        name: 'search_conversations',
        description:
          'Search through conversations using natural language queries. Supports fuzzy matching and filters.',
        input_schema: {
          type: 'object' as const,
          properties: {
            query: {
              type: 'string',
              description: 'The search query (e.g., "authentication", "React hooks")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
            dateFrom: {
              type: 'string',
              description: 'Filter from date (YYYY-MM-DD)',
            },
            dateTo: {
              type: 'string',
              description: 'Filter to date (YYYY-MM-DD)',
            },
            minMessages: {
              type: 'number',
              description: 'Minimum number of messages',
            },
            hasCode: {
              type: 'boolean',
              description: 'Filter for conversations with code snippets',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_conversation_details',
        description:
          'Get detailed information about a specific conversation including topics, decisions, and action items.',
        input_schema: {
          type: 'object' as const,
          properties: {
            uuid: {
              type: 'string',
              description: 'The UUID of the conversation',
            },
          },
          required: ['uuid'],
        },
      },
      {
        name: 'get_stats',
        description:
          'Get statistics about the exported data including total conversations, messages, and date ranges.',
        input_schema: {
          type: 'object' as const,
          properties: {},
        },
      },
      {
        name: 'list_recent_conversations',
        description: 'List recent conversations sorted by date or message count.',
        input_schema: {
          type: 'object' as const,
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)',
            },
            sort: {
              type: 'string',
              enum: ['date', 'messages'],
              description: 'Sort by date or message count',
            },
          },
        },
      },
      {
        name: 'export_to_markdown',
        description:
          'Export a conversation to markdown format suitable for Claude Projects.',
        input_schema: {
          type: 'object' as const,
          properties: {
            uuid: {
              type: 'string',
              description: 'The UUID of the conversation to export',
            },
          },
          required: ['uuid'],
        },
      },
      {
        name: 'create_knowledge_base',
        description:
          'Create a combined knowledge base markdown from multiple conversations.',
        input_schema: {
          type: 'object' as const,
          properties: {
            uuids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of conversation UUIDs to include',
            },
            title: {
              type: 'string',
              description: 'Title for the knowledge base',
            },
            description: {
              type: 'string',
              description: 'Optional description',
            },
          },
          required: ['uuids', 'title'],
        },
      },
      {
        name: 'find_by_topic',
        description: 'Find conversations related to a specific topic.',
        input_schema: {
          type: 'object' as const,
          properties: {
            topic: {
              type: 'string',
              description: 'The topic to search for',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['topic'],
        },
      },
    ];
  }

  /**
   * Execute a tool by name
   */
  async executeTool(
    toolName: string,
    params: Record<string, unknown>
  ): Promise<ToolResult> {
    switch (toolName) {
      case 'search_conversations':
        return this.searchConversations(params as Parameters<typeof this.searchConversations>[0]);
      case 'get_conversation_details':
        return this.getConversationDetails(params as Parameters<typeof this.getConversationDetails>[0]);
      case 'get_stats':
        return this.getStats();
      case 'list_recent_conversations':
        return this.listRecentConversations(params as Parameters<typeof this.listRecentConversations>[0]);
      case 'export_to_markdown':
        return this.exportToMarkdown(params as Parameters<typeof this.exportToMarkdown>[0]);
      case 'create_knowledge_base':
        return this.createKnowledgeBase(params as Parameters<typeof this.createKnowledgeBase>[0]);
      case 'find_by_topic':
        return this.findByTopic(params as Parameters<typeof this.findByTopic>[0]);
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  }

  /**
   * Helper: Generate quick summary
   */
  private generateQuickSummary(conv: Conversation): string {
    const messageCount = conv.chat_messages?.length || 0;
    const date = new Date(conv.created_at).toLocaleDateString();
    return `${messageCount} messages from ${date}`;
  }

  /**
   * Helper: Generate filename
   */
  private generateFilename(conv: Conversation): string {
    const safeName = this.sanitizeFilename(conv.name || 'conversation');
    return `${safeName}.md`;
  }

  /**
   * Helper: Sanitize filename
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-z0-9-_]/gi, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);
  }
}
