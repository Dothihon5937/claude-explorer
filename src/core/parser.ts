/**
 * Core parser for Claude.ai export data
 */
import { readFile } from 'fs/promises';
import { Conversation, Project, User } from './types.js';

export class ClaudeDataParser {
  private conversations: Conversation[] = [];
  private projects: Project[] = [];
  private users: User[] = [];
  private dataPath: string;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  /**
   * Load all data from export files
   */
  async load(): Promise<void> {
    const [conversationsData, projectsData, usersData] = await Promise.all([
      this.loadJSON<Conversation[]>('conversations.json'),
      this.loadJSON<Project[]>('projects.json'),
      this.loadJSON<User[]>('users.json'),
    ]);

    this.conversations = conversationsData;
    this.projects = projectsData;
    this.users = usersData;
  }

  /**
   * Get all conversations
   */
  getConversations(): Conversation[] {
    return this.conversations;
  }

  /**
   * Get conversations with messages
   */
  getConversationsWithMessages(): Conversation[] {
    return this.conversations.filter(
      (c) => c.chat_messages && c.chat_messages.length > 0
    );
  }

  /**
   * Get conversation by UUID
   */
  getConversation(uuid: string): Conversation | undefined {
    return this.conversations.find((c) => c.uuid === uuid);
  }

  /**
   * Get all projects
   */
  getProjects(): Project[] {
    return this.projects;
  }

  /**
   * Get project by UUID
   */
  getProject(uuid: string): Project | undefined {
    return this.projects.find((p) => p.uuid === uuid);
  }

  /**
   * Get users
   */
  getUsers(): User[] {
    return this.users;
  }

  /**
   * Get statistics about the data
   */
  getStats() {
    const conversationsWithMessages = this.getConversationsWithMessages();
    const messageCounts = conversationsWithMessages.map(
      (c) => c.chat_messages.length
    );

    return {
      totalConversations: this.conversations.length,
      conversationsWithMessages: conversationsWithMessages.length,
      totalProjects: this.projects.length,
      projectsWithDocs: this.projects.filter((p) => p.docs && p.docs.length > 0)
        .length,
      messages: {
        total: messageCounts.reduce((sum, count) => sum + count, 0),
        min: messageCounts.length > 0 ? Math.min(...messageCounts) : 0,
        max: messageCounts.length > 0 ? Math.max(...messageCounts) : 0,
        avg:
          messageCounts.length > 0
            ? messageCounts.reduce((sum, count) => sum + count, 0) /
              messageCounts.length
            : 0,
      },
      dateRange: this.getDateRange(),
    };
  }

  /**
   * Get date range of conversations
   */
  private getDateRange(): { earliest: string; latest: string } | null {
    const dates = this.conversations
      .map((c) => new Date(c.created_at))
      .filter((d) => !isNaN(d.getTime()));

    if (dates.length === 0) {
      return null;
    }

    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latest = new Date(Math.max(...dates.map((d) => d.getTime())));

    return {
      earliest: earliest.toISOString(),
      latest: latest.toISOString(),
    };
  }

  /**
   * Load and parse JSON file
   */
  private async loadJSON<T>(filename: string): Promise<T> {
    const filePath = `${this.dataPath}/${filename}`;
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }
}
