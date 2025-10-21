/**
 * Enhanced fuzzy search using FuseJS
 */
import Fuse from 'fuse.js';
import { Conversation, Project, Message } from './types.js';

export interface FuzzySearchResult<T> {
  item: T;
  score: number;
  matches: Array<{
    key: string;
    value: string;
    indices: ReadonlyArray<readonly [number, number]>;
  }>;
}

export class FuzzySearchEngine {
  private conversationIndex: Fuse<Conversation> | null = null;
  private projectIndex: Fuse<Project> | null = null;

  /**
   * Build fuzzy search indices
   */
  buildIndices(conversations: Conversation[], projects: Project[]): void {
    // Conversation index with fuzzy matching
    this.conversationIndex = new Fuse(conversations, {
      keys: [
        { name: 'name', weight: 2.0 },
        { name: 'summary', weight: 1.5 },
        { name: 'chat_messages.text', weight: 1.0 },
        { name: 'chat_messages.content.text', weight: 1.0 },
      ],
      includeScore: true,
      includeMatches: true,
      threshold: 0.4, // More lenient for fuzzy matching
      ignoreLocation: true,
      minMatchCharLength: 2,
      findAllMatches: true,
    });

    // Project index
    this.projectIndex = new Fuse(projects, {
      keys: [
        { name: 'name', weight: 2.0 },
        { name: 'description', weight: 1.5 },
        { name: 'docs.content', weight: 1.0 },
        { name: 'docs.filename', weight: 1.2 },
      ],
      includeScore: true,
      includeMatches: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }

  /**
   * Search conversations with fuzzy matching
   */
  searchConversations(
    query: string,
    limit = 20
  ): FuzzySearchResult<Conversation>[] {
    if (!this.conversationIndex) {
      throw new Error('Conversation index not built');
    }

    const results = this.conversationIndex.search(query, { limit });

    return results.map((result) => ({
      item: result.item,
      score: 1 - (result.score || 0), // Invert score (higher is better)
      matches: (result.matches || []).map((match) => ({
        key: match.key || '',
        value: match.value || '',
        indices: match.indices || [],
      })),
    }));
  }

  /**
   * Search projects with fuzzy matching
   */
  searchProjects(query: string, limit = 20): FuzzySearchResult<Project>[] {
    if (!this.projectIndex) {
      throw new Error('Project index not built');
    }

    const results = this.projectIndex.search(query, { limit });

    return results.map((result) => ({
      item: result.item,
      score: 1 - (result.score || 0),
      matches: (result.matches || []).map((match) => ({
        key: match.key || '',
        value: match.value || '',
        indices: match.indices || [],
      })),
    }));
  }

  /**
   * Advanced search with multiple criteria
   */
  advancedSearch(criteria: {
    query?: string;
    topics?: string[];
    hasCode?: boolean;
    minMessages?: number;
    maxMessages?: number;
    dateFrom?: Date;
    dateTo?: Date;
    conversations: Conversation[];
  }): Conversation[] {
    let results = criteria.conversations;

    // Text search
    if (criteria.query && this.conversationIndex) {
      const searchResults = this.searchConversations(
        criteria.query,
        results.length
      );
      const matchedUuids = new Set(searchResults.map((r) => r.item.uuid));
      results = results.filter((c) => matchedUuids.has(c.uuid));
    }

    // Filter by topics (fuzzy match in name/summary)
    if (criteria.topics && criteria.topics.length > 0) {
      results = results.filter((conv) => {
        const text = `${conv.name} ${conv.summary}`.toLowerCase();
        return criteria.topics!.some((topic) =>
          text.includes(topic.toLowerCase())
        );
      });
    }

    // Filter by code presence
    if (criteria.hasCode !== undefined) {
      results = results.filter((conv) => {
        const hasCode = conv.chat_messages?.some((msg) =>
          this.messageHasCode(msg)
        );
        return hasCode === criteria.hasCode;
      });
    }

    // Filter by message count
    if (criteria.minMessages !== undefined) {
      results = results.filter(
        (c) => (c.chat_messages?.length || 0) >= criteria.minMessages!
      );
    }

    if (criteria.maxMessages !== undefined) {
      results = results.filter(
        (c) => (c.chat_messages?.length || 0) <= criteria.maxMessages!
      );
    }

    // Filter by date range
    if (criteria.dateFrom) {
      results = results.filter(
        (c) => new Date(c.created_at) >= criteria.dateFrom!
      );
    }

    if (criteria.dateTo) {
      results = results.filter(
        (c) => new Date(c.created_at) <= criteria.dateTo!
      );
    }

    return results;
  }

  /**
   * Check if message contains code
   */
  private messageHasCode(msg: Message): boolean {
    const text = msg.text || '';

    // Check for code blocks
    if (text.includes('```')) return true;

    // Check for tool use (which often contains code)
    if (msg.content?.some((block) => block.type === 'tool_use')) {
      return true;
    }

    return false;
  }

  /**
   * Get search suggestions based on partial query
   */
  getSuggestions(partialQuery: string, conversations: Conversation[]): string[] {
    // Extract common terms from conversation names and summaries
    const terms = new Set<string>();

    conversations.forEach((conv) => {
      const words = `${conv.name} ${conv.summary}`
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3);

      words.forEach((word) => {
        if (word.startsWith(partialQuery.toLowerCase())) {
          terms.add(word);
        }
      });
    });

    return Array.from(terms).slice(0, 10);
  }
}
