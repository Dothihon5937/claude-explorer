/**
 * AI Librarian Agent - Natural language interface to Claude export data
 */
import Anthropic from '@anthropic-ai/sdk';
import { AgentTools } from './agent-tools.js';
import { ModelSelector } from './models.js';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  message: string;
  toolCalls?: Array<{
    tool: string;
    input: Record<string, unknown>;
    result: unknown;
  }>;
  model?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export class LibrarianAgent {
  private client: Anthropic;
  public tools: AgentTools; // Public for CLI access
  private conversationHistory: AgentMessage[] = [];
  private modelSelector: ModelSelector;

  private systemPrompt = `You are an AI librarian assistant for Claude.ai export data. Your role is to help users search, explore, and extract context from their Claude conversation history.

You have access to tools that can:
- Search conversations using natural language queries
- Get detailed information about specific conversations
- List recent conversations
- Find conversations by topic
- Export conversations to markdown
- Create knowledge bases from multiple conversations
- Get statistics about the data

When helping users:
1. Be conversational and helpful
2. Ask clarifying questions if the request is ambiguous
3. Use multiple tools in sequence when needed
4. Suggest related searches or useful operations
5. Provide clear summaries of what you find
6. Help package context in ways that are useful for uploading to Claude Projects

When a user asks to find or search for something:
- Use search_conversations or find_by_topic tools
- Present results clearly with UUIDs for reference
- Offer to provide more details or export results

When packaging context for the user's work account:
- Recommend using create_knowledge_base for related conversations
- Suggest markdown export format for Claude Projects
- Help identify the most relevant conversations

Be proactive in suggesting useful next steps based on what you find.`;

  constructor(client: Anthropic, dataPath: string) {
    this.client = client;
    this.tools = new AgentTools(dataPath);
    this.modelSelector = new ModelSelector();
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    await this.tools.initialize();
  }

  /**
   * Process a user message
   */
  async chat(userMessage: string): Promise<AgentResponse> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const toolCalls: Array<{
      tool: string;
      input: Record<string, unknown>;
      result: unknown;
    }> = [];

    // Build messages for API
    const messages: Anthropic.MessageParam[] = this.conversationHistory.map(
      (msg) => ({
        role: msg.role,
        content: msg.content,
      })
    );

    // Select appropriate model (Sonnet 4.5 for chat with tool use)
    const modelSelection = this.modelSelector.selectModel({
      type: 'chat',
      complexity: 'complex',
      multiStep: true,
      requiresReasoning: true,
    });

    // Initial API call
    let response = await this.client.messages.create({
      model: modelSelection.model,
      max_tokens: 8192,
      system: this.systemPrompt,
      tools: AgentTools.getToolsDefinition(),
      messages,
    });

    // Handle tool use iterations
    let iterations = 0;
    const maxIterations = 5;

    while (
      response.stop_reason === 'tool_use' &&
      iterations < maxIterations
    ) {
      iterations++;

      // Extract tool uses
      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute tools
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUses) {
        const result = await this.tools.executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>
        );

        toolCalls.push({
          tool: toolUse.name,
          input: toolUse.input as Record<string, unknown>,
          result: result.data,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Add assistant response and tool results to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Continue conversation with same model
      response = await this.client.messages.create({
        model: modelSelection.model,
        max_tokens: 8192,
        system: this.systemPrompt,
        tools: AgentTools.getToolsDefinition(),
        messages,
      });
    }

    // Extract final text response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    const finalMessage = textBlocks.map((block) => block.text).join('\n\n');

    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: finalMessage,
    });

    return {
      message: finalMessage,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: modelSelection.model,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Process with streaming
   */
  async *chatStream(
    userMessage: string
  ): AsyncGenerator<string, AgentResponse, undefined> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const toolCalls: Array<{
      tool: string;
      input: Record<string, unknown>;
      result: unknown;
    }> = [];

    // Build messages for API
    const messages: Anthropic.MessageParam[] = this.conversationHistory.map(
      (msg) => ({
        role: msg.role,
        content: msg.content,
      })
    );

    // Select model for streaming
    const modelSelection = this.modelSelector.selectModel({
      type: 'chat',
      complexity: 'complex',
      multiStep: true,
    });

    // Stream initial response
    const stream = await this.client.messages.stream({
      model: modelSelection.model,
      max_tokens: 8192,
      system: this.systemPrompt,
      tools: AgentTools.getToolsDefinition(),
      messages,
    });

    let fullResponse = '';
    let stopReason: string | null = null;
    let responseContent: Anthropic.ContentBlock[] = [];

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullResponse += text;
          yield text;
        }
      } else if (event.type === 'message_stop') {
        const finalMessage = await stream.finalMessage();
        stopReason = finalMessage.stop_reason;
        responseContent = finalMessage.content;
      }
    }

    // Handle tool use if needed
    if (stopReason === 'tool_use') {
      yield '\n\n[Using tools...]\n\n';

      // Execute tools
      const toolUses = responseContent.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUses) {
        yield `[Executing: ${toolUse.name}]\n`;

        const result = await this.tools.executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>
        );

        toolCalls.push({
          tool: toolUse.name,
          input: toolUse.input as Record<string, unknown>,
          result: result.data,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Continue with tool results
      messages.push({
        role: 'assistant',
        content: responseContent,
      });

      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Stream final response with same model
      const finalStream = await this.client.messages.stream({
        model: modelSelection.model,
        max_tokens: 8192,
        system: this.systemPrompt,
        tools: AgentTools.getToolsDefinition(),
        messages,
      });

      for await (const event of finalStream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const text = event.delta.text;
            fullResponse += text;
            yield text;
          }
        }
      }
    }

    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: fullResponse,
    });

    return {
      message: fullResponse,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: modelSelection.model,
    };
  }

  /**
   * Reset conversation history
   */
  resetHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Load history from previous session
   */
  loadHistory(history: AgentMessage[]): void {
    this.conversationHistory = history;
  }
}
