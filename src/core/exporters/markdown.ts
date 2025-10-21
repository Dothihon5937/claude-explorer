/**
 * Markdown exporter for Claude Projects
 */
import { Conversation, Message, Project } from '../types.js';

export class MarkdownExporter {
  /**
   * Export conversation to markdown format
   */
  exportConversation(conversation: Conversation): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${conversation.name || 'Untitled Conversation'}\n`);

    // Metadata
    lines.push('## Metadata\n');
    lines.push(`- **Created**: ${this.formatDate(conversation.created_at)}`);
    lines.push(`- **Updated**: ${this.formatDate(conversation.updated_at)}`);
    lines.push(
      `- **Messages**: ${conversation.chat_messages?.length || 0}\n`
    );

    if (conversation.summary) {
      lines.push(`## Summary\n`);
      lines.push(`${conversation.summary}\n`);
    }

    // Messages
    if (conversation.chat_messages && conversation.chat_messages.length > 0) {
      lines.push('## Conversation\n');

      conversation.chat_messages.forEach((msg, idx) => {
        lines.push(this.formatMessage(msg, idx + 1));
      });
    }

    return lines.join('\n');
  }

  /**
   * Export project to markdown
   */
  exportProject(project: Project): string {
    const lines: string[] = [];

    lines.push(`# ${project.name}\n`);

    if (project.description) {
      lines.push(`${project.description}\n`);
    }

    lines.push('## Project Info\n');
    lines.push(`- **Created**: ${this.formatDate(project.created_at)}`);
    lines.push(`- **Creator**: ${project.creator.full_name}`);
    lines.push(`- **Documents**: ${project.docs?.length || 0}\n`);

    if (project.prompt_template) {
      lines.push('## Prompt Template\n');
      lines.push('```');
      lines.push(project.prompt_template);
      lines.push('```\n');
    }

    // Export documents
    if (project.docs && project.docs.length > 0) {
      lines.push('## Documents\n');

      project.docs.forEach((doc) => {
        lines.push(`### ${doc.filename}\n`);
        lines.push(doc.content);
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  /**
   * Export multiple conversations as a knowledge base
   */
  exportAsKnowledgeBase(
    conversations: Conversation[],
    title: string,
    description?: string
  ): string {
    const lines: string[] = [];

    lines.push(`# ${title}\n`);

    if (description) {
      lines.push(`${description}\n`);
    }

    lines.push('## Overview\n');
    lines.push(`- **Total Conversations**: ${conversations.length}`);
    lines.push(
      `- **Total Messages**: ${conversations.reduce((sum, c) => sum + (c.chat_messages?.length || 0), 0)}`
    );
    lines.push(`- **Generated**: ${new Date().toISOString()}\n`);

    lines.push('---\n');

    // Include each conversation
    conversations.forEach((conv, idx) => {
      lines.push(`## Conversation ${idx + 1}: ${conv.name || 'Untitled'}\n`);
      lines.push(`**Date**: ${this.formatDate(conv.created_at)}\n`);

      if (conv.summary) {
        lines.push(`**Summary**: ${conv.summary}\n`);
      }

      if (conv.chat_messages && conv.chat_messages.length > 0) {
        conv.chat_messages.forEach((msg, msgIdx) => {
          lines.push(this.formatMessage(msg, msgIdx + 1, false));
        });
      }

      lines.push('\n---\n');
    });

    return lines.join('\n');
  }

  /**
   * Format a single message
   */
  private formatMessage(
    msg: Message,
    index: number,
    includeHeader = true
  ): string {
    const lines: string[] = [];

    if (includeHeader) {
      lines.push(`### Message ${index} - ${msg.sender}\n`);
      lines.push(`*${this.formatDate(msg.created_at)}*\n`);
    } else {
      lines.push(`**${msg.sender}**: `);
    }

    // Extract and format content
    if (msg.text) {
      lines.push(msg.text);
    }

    // Include structured content
    msg.content?.forEach((block) => {
      if (block.type === 'text' && block.text && block.text !== msg.text) {
        lines.push(block.text);
      } else if (block.type === 'tool_use' && block.name) {
        lines.push(`\n*[Tool: ${block.name}]*`);
        if (block.input) {
          lines.push('```json');
          lines.push(JSON.stringify(block.input, null, 2));
          lines.push('```');
        }
      }
    });

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Format date for display
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
