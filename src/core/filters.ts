/**
 * Filter engine for conversations and projects
 */
import { Conversation, SearchOptions, Project } from './types.js';

export class FilterEngine {
  /**
   * Filter conversations based on search options
   */
  filterConversations(
    conversations: Conversation[],
    options: SearchOptions
  ): Conversation[] {
    let filtered = [...conversations];

    // Filter by message presence
    if (options.hasMessages !== undefined) {
      filtered = filtered.filter((c) => {
        const hasMessages = c.chat_messages && c.chat_messages.length > 0;
        return hasMessages === options.hasMessages;
      });
    }

    // Filter by date range
    if (options.dateFrom) {
      filtered = filtered.filter(
        (c) => new Date(c.created_at) >= options.dateFrom!
      );
    }

    if (options.dateTo) {
      filtered = filtered.filter(
        (c) => new Date(c.created_at) <= options.dateTo!
      );
    }

    // Filter by message count
    if (options.minMessages !== undefined) {
      filtered = filtered.filter(
        (c) => (c.chat_messages?.length || 0) >= options.minMessages!
      );
    }

    if (options.maxMessages !== undefined) {
      filtered = filtered.filter(
        (c) => (c.chat_messages?.length || 0) <= options.maxMessages!
      );
    }

    // Note: Project filtering requires additional context
    // Will be handled in a separate method

    return filtered;
  }

  /**
   * Filter projects
   */
  filterProjects(
    projects: Project[],
    options: {
      hasDocsOnly?: boolean;
      nameContains?: string;
      isPrivate?: boolean;
    }
  ): Project[] {
    let filtered = [...projects];

    if (options.hasDocsOnly) {
      filtered = filtered.filter((p) => p.docs && p.docs.length > 0);
    }

    if (options.nameContains) {
      const searchTerm = options.nameContains.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm)
      );
    }

    if (options.isPrivate !== undefined) {
      filtered = filtered.filter((p) => p.is_private === options.isPrivate);
    }

    return filtered;
  }

  /**
   * Group conversations by date
   */
  groupByDate(
    conversations: Conversation[]
  ): Map<string, Conversation[]> {
    const groups = new Map<string, Conversation[]>();

    conversations.forEach((conv) => {
      const date = new Date(conv.created_at).toISOString().split('T')[0];
      const existing = groups.get(date) || [];
      existing.push(conv);
      groups.set(date, existing);
    });

    return groups;
  }

  /**
   * Group conversations by month
   */
  groupByMonth(
    conversations: Conversation[]
  ): Map<string, Conversation[]> {
    const groups = new Map<string, Conversation[]>();

    conversations.forEach((conv) => {
      const date = new Date(conv.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = groups.get(monthKey) || [];
      existing.push(conv);
      groups.set(monthKey, existing);
    });

    return groups;
  }

  /**
   * Sort conversations
   */
  sortConversations(
    conversations: Conversation[],
    by: 'date' | 'messages' | 'name',
    order: 'asc' | 'desc' = 'desc'
  ): Conversation[] {
    const sorted = [...conversations];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (by) {
        case 'date':
          comparison =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
        case 'messages':
          comparison =
            (a.chat_messages?.length || 0) - (b.chat_messages?.length || 0);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }
}
