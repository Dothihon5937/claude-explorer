/**
 * Smart context extraction and summarization
 */
import { Conversation, Message } from './types.js';

export interface ExtractedContext {
  topics: string[];
  codeSnippets: Array<{ language: string; code: string }>;
  keyDecisions: string[];
  actionItems: string[];
  entities: Map<string, number>; // entity -> frequency
}

export class ContextExtractor {
  /**
   * Extract key context from a conversation
   */
  extractContext(conversation: Conversation): ExtractedContext {
    const context: ExtractedContext = {
      topics: [],
      codeSnippets: [],
      keyDecisions: [],
      actionItems: [],
      entities: new Map(),
    };

    if (!conversation.chat_messages) {
      return context;
    }

    // Process all messages
    conversation.chat_messages.forEach((msg) => {
      this.extractCodeSnippets(msg, context.codeSnippets);
      this.extractKeyPhrases(msg, context);
      this.extractEntities(msg, context.entities);
    });

    // Extract topics from frequent entities
    context.topics = this.extractTopics(context.entities);

    return context;
  }

  /**
   * Generate summary from conversation
   */
  generateSummary(conversation: Conversation): string {
    const context = this.extractContext(conversation);
    const messageCount = conversation.chat_messages?.length || 0;

    const parts: string[] = [];

    parts.push(
      `**${conversation.name || 'Untitled Conversation'}**\n`
    );

    parts.push(
      `A conversation with ${messageCount} message${messageCount !== 1 ? 's' : ''} ` +
      `from ${new Date(conversation.created_at).toLocaleDateString()}.`
    );

    if (context.topics.length > 0) {
      parts.push(`\n**Topics**: ${context.topics.slice(0, 5).join(', ')}`);
    }

    if (context.codeSnippets.length > 0) {
      const languages = [
        ...new Set(context.codeSnippets.map((s) => s.language)),
      ];
      parts.push(
        `\n**Code**: ${context.codeSnippets.length} snippet${context.codeSnippets.length !== 1 ? 's' : ''} ` +
        `(${languages.join(', ')})`
      );
    }

    if (context.keyDecisions.length > 0) {
      parts.push(`\n**Key Decisions**:`);
      context.keyDecisions.slice(0, 3).forEach((decision) => {
        parts.push(`- ${decision}`);
      });
    }

    if (context.actionItems.length > 0) {
      parts.push(`\n**Action Items**:`);
      context.actionItems.slice(0, 3).forEach((item) => {
        parts.push(`- ${item}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Extract code snippets from message
   */
  private extractCodeSnippets(
    msg: Message,
    snippets: Array<{ language: string; code: string }>
  ): void {
    const text = this.getMessageText(msg);

    // Match code blocks with language specifier
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      snippets.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      });
    }

    // Also check content blocks for tool use
    msg.content?.forEach((block) => {
      if (block.type === 'tool_use' && block.input) {
        const inputStr = JSON.stringify(block.input, null, 2);
        if (inputStr.length > 50) {
          snippets.push({
            language: 'json',
            code: inputStr,
          });
        }
      }
    });
  }

  /**
   * Extract key phrases and patterns
   */
  private extractKeyPhrases(msg: Message, context: ExtractedContext): void {
    const text = this.getMessageText(msg);

    // Decision indicators
    const decisionPatterns = [
      /(?:decided|chosen|selected|opted for|going with|will use)\s+([^.!?]{10,80})/gi,
      /(?:the decision is|we'll)\s+([^.!?]{10,80})/gi,
    ];

    decisionPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          context.keyDecisions.push(match[1].trim());
        }
      }
    });

    // Action items
    const actionPatterns = [
      /(?:need to|should|must|will|let's)\s+([^.!?]{10,80})/gi,
      /(?:todo|action item|next step):\s*([^.!?]{10,80})/gi,
    ];

    actionPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          context.actionItems.push(match[1].trim());
        }
      }
    });
  }

  /**
   * Extract named entities (simple keyword extraction)
   */
  private extractEntities(msg: Message, entities: Map<string, number>): void {
    const text = this.getMessageText(msg);

    // Extract capitalized words (potential entities)
    const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];

    words.forEach((word) => {
      // Filter out common words and very short ones
      if (word.length > 3 && !this.isCommonWord(word)) {
        entities.set(word, (entities.get(word) || 0) + 1);
      }
    });

    // Also extract common tech terms
    const techTerms = text.match(
      /\b(?:API|REST|GraphQL|SQL|JSON|XML|HTTP|HTTPS|TypeScript|JavaScript|Python|React|Node\.js|database|server|client|authentication|authorization)\b/gi
    ) || [];

    techTerms.forEach((term) => {
      const normalized = term.toLowerCase();
      entities.set(normalized, (entities.get(normalized) || 0) + 1);
    });
  }

  /**
   * Extract topics from entities
   */
  private extractTopics(entities: Map<string, number>): string[] {
    // Sort by frequency
    const sorted = Array.from(entities.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count >= 2); // Must appear at least twice

    return sorted.slice(0, 10).map(([entity]) => entity);
  }

  /**
   * Get full message text
   */
  private getMessageText(msg: Message): string {
    const parts: string[] = [];

    if (msg.text) {
      parts.push(msg.text);
    }

    msg.content?.forEach((block) => {
      if (block.text) {
        parts.push(block.text);
      }
    });

    return parts.join(' ');
  }

  /**
   * Check if word is common (simple filter)
   */
  private isCommonWord(word: string): boolean {
    const common = new Set([
      'The',
      'This',
      'That',
      'These',
      'Those',
      'Here',
      'There',
      'When',
      'Where',
      'What',
      'Which',
      'Who',
      'How',
      'Why',
      'Can',
      'Could',
      'Would',
      'Should',
      'Will',
      'Let',
      'Please',
      'Thank',
      'Thanks',
    ]);

    return common.has(word);
  }
}
