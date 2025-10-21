/**
 * JSON exporter for structured data export
 */
import { Conversation, Project, ExportOptions } from '../types.js';

export class JSONExporter {
  /**
   * Export conversation to JSON
   */
  exportConversation(
    conversation: Conversation,
    options: ExportOptions = { format: 'json' }
  ): string {
    if (options.includeMetadata) {
      return JSON.stringify(
        {
          conversation,
          metadata: this.generateMetadata(conversation),
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      );
    }

    return JSON.stringify(conversation, null, 2);
  }

  /**
   * Export multiple conversations
   */
  exportConversations(
    conversations: Conversation[],
    options: ExportOptions = { format: 'json' }
  ): string {
    if (options.includeMetadata) {
      return JSON.stringify(
        {
          conversations,
          summary: {
            total: conversations.length,
            totalMessages: conversations.reduce(
              (sum, c) => sum + (c.chat_messages?.length || 0),
              0
            ),
            dateRange: this.getDateRange(conversations),
          },
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      );
    }

    return JSON.stringify(conversations, null, 2);
  }

  /**
   * Export project to JSON
   */
  exportProject(project: Project): string {
    return JSON.stringify(project, null, 2);
  }

  /**
   * Export projects
   */
  exportProjects(projects: Project[]): string {
    return JSON.stringify(projects, null, 2);
  }

  /**
   * Export as compact JSON (no formatting)
   */
  exportCompact(data: unknown): string {
    return JSON.stringify(data);
  }

  /**
   * Generate metadata for a conversation
   */
  private generateMetadata(conversation: Conversation) {
    const messages = conversation.chat_messages || [];
    const dates = messages
      .map((m) => new Date(m.created_at))
      .filter((d) => !isNaN(d.getTime()));

    return {
      messageCount: messages.length,
      dateRange:
        dates.length > 0
          ? {
              start: new Date(
                Math.min(...dates.map((d) => d.getTime()))
              ).toISOString(),
              end: new Date(
                Math.max(...dates.map((d) => d.getTime()))
              ).toISOString(),
            }
          : null,
      participants: [...new Set(messages.map((m) => m.sender))],
      hasAttachments: messages.some(
        (m) => m.attachments && m.attachments.length > 0
      ),
      hasFiles: messages.some((m) => m.files && m.files.length > 0),
    };
  }

  /**
   * Get date range for conversations
   */
  private getDateRange(conversations: Conversation[]) {
    const dates = conversations
      .map((c) => new Date(c.created_at))
      .filter((d) => !isNaN(d.getTime()));

    if (dates.length === 0) return null;

    return {
      earliest: new Date(
        Math.min(...dates.map((d) => d.getTime()))
      ).toISOString(),
      latest: new Date(
        Math.max(...dates.map((d) => d.getTime()))
      ).toISOString(),
    };
  }
}
