/**
 * Type definitions for Claude.ai export data structures
 */

export interface User {
  uuid: string;
  full_name: string;
  email_address: string;
  verified_phone_number: string | null;
}

export interface Account {
  uuid: string;
}

export interface MessageContent {
  start_timestamp: string | null;
  stop_timestamp: string | null;
  flags: string[] | null;
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  citations?: unknown[];
}

export interface Message {
  uuid: string;
  text: string;
  content: MessageContent[];
  sender: string;
  created_at: string;
  updated_at: string;
  attachments: unknown[];
  files: unknown[];
}

export interface Conversation {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  account: Account;
  chat_messages: Message[];
}

export interface ProjectDoc {
  uuid: string;
  filename: string;
  content: string;
}

export interface ProjectCreator {
  uuid: string;
  full_name: string;
}

export interface Project {
  uuid: string;
  name: string;
  description: string;
  is_private: boolean;
  is_starter_project: boolean;
  prompt_template: string;
  created_at: string;
  updated_at: string;
  creator: ProjectCreator;
  docs: ProjectDoc[];
}

/**
 * Search and filter types
 */
export interface SearchOptions {
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
  projectUuid?: string;
  hasMessages?: boolean;
  minMessages?: number;
  maxMessages?: number;
}

export interface SearchResult {
  conversation: Conversation;
  score: number;
  matches: {
    messageIndex: number;
    snippet: string;
  }[];
}

/**
 * Export types
 */
export interface ExportOptions {
  format: 'markdown' | 'json' | 'bundle';
  includeMetadata?: boolean;
  includeAttachments?: boolean;
  summarize?: boolean;
}

export interface ConversationBundle {
  conversation: Conversation;
  metadata: {
    messageCount: number;
    dateRange: {
      start: string;
      end: string;
    };
    participants: string[];
    topics?: string[];
  };
  exportedAt: string;
}
