/**
 * Bundle exporter - creates ZIP archives with conversations
 */
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { Conversation, Project } from '../types.js';
import { MarkdownExporter } from './markdown.js';
import { JSONExporter } from './json.js';

export class BundleExporter {
  private markdownExporter = new MarkdownExporter();
  private jsonExporter = new JSONExporter();

  /**
   * Export conversation as a ZIP bundle
   */
  async exportConversationBundle(
    conversation: Conversation,
    outputPath: string
  ): Promise<void> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      // Add JSON version
      archive.append(
        this.jsonExporter.exportConversation(conversation, {
          format: 'json',
          includeMetadata: true,
        }),
        { name: 'conversation.json' }
      );

      // Add Markdown version
      archive.append(this.markdownExporter.exportConversation(conversation), {
        name: 'conversation.md',
      });

      // Add metadata file
      archive.append(
        JSON.stringify(
          {
            uuid: conversation.uuid,
            name: conversation.name,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
            message_count: conversation.chat_messages?.length || 0,
            exported_at: new Date().toISOString(),
          },
          null,
          2
        ),
        { name: 'metadata.json' }
      );

      archive.finalize();
    });
  }

  /**
   * Export multiple conversations as a bundle
   */
  async exportConversationsBundle(
    conversations: Conversation[],
    outputPath: string,
    title = 'Claude Conversations Export'
  ): Promise<void> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      // Add individual conversations
      conversations.forEach((conv, idx) => {
        const safeName = this.sanitizeFilename(
          conv.name || `conversation-${idx + 1}`
        );

        archive.append(this.jsonExporter.exportConversation(conv), {
          name: `conversations/${safeName}.json`,
        });

        archive.append(this.markdownExporter.exportConversation(conv), {
          name: `conversations/${safeName}.md`,
        });
      });

      // Add combined markdown
      archive.append(
        this.markdownExporter.exportAsKnowledgeBase(
          conversations,
          title,
          `Export of ${conversations.length} conversations`
        ),
        { name: 'combined.md' }
      );

      // Add index
      archive.append(
        JSON.stringify(
          {
            title,
            total_conversations: conversations.length,
            total_messages: conversations.reduce(
              (sum, c) => sum + (c.chat_messages?.length || 0),
              0
            ),
            exported_at: new Date().toISOString(),
            conversations: conversations.map((c) => ({
              uuid: c.uuid,
              name: c.name,
              created_at: c.created_at,
              message_count: c.chat_messages?.length || 0,
            })),
          },
          null,
          2
        ),
        { name: 'index.json' }
      );

      archive.finalize();
    });
  }

  /**
   * Export project bundle
   */
  async exportProjectBundle(
    project: Project,
    outputPath: string
  ): Promise<void> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      // Add project JSON
      archive.append(this.jsonExporter.exportProject(project), {
        name: 'project.json',
      });

      // Add project markdown
      archive.append(this.markdownExporter.exportProject(project), {
        name: 'project.md',
      });

      // Add individual docs
      project.docs?.forEach((doc) => {
        archive.append(doc.content, { name: `docs/${doc.filename}` });
      });

      archive.finalize();
    });
  }

  /**
   * Sanitize filename for safe use
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-z0-9-_]/gi, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);
  }
}
