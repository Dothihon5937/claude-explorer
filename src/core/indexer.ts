/**
 * Full-text search indexer using lunr.js
 */
import lunr from 'lunr';
import { Conversation, Message, SearchResult } from './types.js';

export class SearchIndexer {
  private index: lunr.Index | null = null;
  private conversations: Map<string, Conversation> = new Map();

  /**
   * Build search index from conversations
   */
  buildIndex(conversations: Conversation[]): void {
    // Store conversations by UUID for quick lookup
    this.conversations = new Map(
      conversations.map((c) => [c.uuid, c])
    );

    // Helper to extract message text
    const extractText = (msg: Message): string => {
      const parts: string[] = [];
      if (msg.text) parts.push(msg.text);
      msg.content?.forEach((block) => {
        if (block.text) parts.push(block.text);
      });
      return parts.join(' ');
    };

    // Build lunr index
    this.index = lunr(function () {
      this.ref('id');
      this.field('name', { boost: 10 });
      this.field('summary', { boost: 5 });
      this.field('messages', { boost: 1 });

      conversations.forEach((conv) => {
        // Combine all message text
        const messageText = conv.chat_messages
          ?.map((msg) => extractText(msg))
          .join(' ') || '';

        this.add({
          id: conv.uuid,
          name: conv.name || '',
          summary: conv.summary || '',
          messages: messageText,
        });
      });
    });
  }

  /**
   * Search conversations
   */
  search(query: string, limit = 50): SearchResult[] {
    if (!this.index) {
      throw new Error('Index not built. Call buildIndex() first.');
    }

    const results = this.index.search(query);

    return results.slice(0, limit).map((result) => {
      const conversation = this.conversations.get(result.ref);
      if (!conversation) {
        throw new Error(`Conversation ${result.ref} not found in cache`);
      }

      return {
        conversation,
        score: result.score,
        matches: this.findMatches(conversation, query),
      };
    });
  }

  /**
   * Find matching snippets in conversation
   */
  private findMatches(
    conversation: Conversation,
    query: string
  ): { messageIndex: number; snippet: string }[] {
    const matches: { messageIndex: number; snippet: string }[] = [];
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter((w) => w.length > 2);

    conversation.chat_messages?.forEach((msg, idx) => {
      const text = this.extractMessageText(msg);
      const textLower = text.toLowerCase();

      // Check if any query words are in this message
      const hasMatch = words.some((word) => textLower.includes(word));

      if (hasMatch) {
        // Find best snippet (first occurrence of first word)
        const firstWord = words[0];
        const index = textLower.indexOf(firstWord);
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(text.length, index + 150);
          let snippet = text.substring(start, end);

          if (start > 0) snippet = '...' + snippet;
          if (end < text.length) snippet = snippet + '...';

          matches.push({
            messageIndex: idx,
            snippet,
          });
        }
      }
    });

    return matches.slice(0, 5); // Limit to 5 matches per conversation
  }

  /**
   * Extract text from message content
   */
  private extractMessageText(msg: Message): string {
    const parts: string[] = [];

    // Add main text
    if (msg.text) {
      parts.push(msg.text);
    }

    // Extract text from content blocks
    msg.content?.forEach((block) => {
      if (block.text) {
        parts.push(block.text);
      }
      if (block.type === 'tool_use' && block.input) {
        // Include tool use content as well
        parts.push(JSON.stringify(block.input));
      }
    });

    return parts.join(' ');
  }
}
