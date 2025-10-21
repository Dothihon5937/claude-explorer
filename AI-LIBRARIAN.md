# 🤖 AI Librarian - Natural Language Interface

The AI Librarian is an intelligent assistant that helps you search, explore, and package context from your Claude conversation history using natural language.

## Features

### 🧠 Natural Language Queries
Ask questions in plain English:
- "Find conversations about React authentication"
- "Show me discussions about database design from last year"
- "What conversations have the most code snippets?"
- "Create a knowledge base about my API projects"

### 🔧 Intelligent Tools
The librarian has access to powerful tools:
- **Search** - Fuzzy search with advanced filtering
- **Details** - Extract topics, decisions, and action items
- **Export** - Create markdown files for Claude Projects
- **Knowledge Bases** - Combine multiple conversations
- **Statistics** - Analyze your conversation patterns

### 💬 Conversational Interface
- Multi-turn conversations with context
- Session persistence (resume later)
- Streaming responses for better UX
- Interactive chat mode

## Setup

### 1. Authenticate

```bash
cd claude-explorer
npm run login
```

This uses OAuth (like Claude Code) to authenticate with your claude.ai account.

**For now**: You'll be prompted for an API key. Get one from https://console.anthropic.com/

**Coming soon**: Full OAuth browser flow!

### 2. Run

```bash
npm run chat
```

That's it! The librarian will remember your authentication.

See [AUTHENTICATION.md](AUTHENTICATION.md) for detailed auth info.

## Usage Examples

### Finding Conversations

**User:** "Find all conversations about authentication"

**Librarian:** *searches and presents results with UUIDs*

### Getting Details

**User:** "Tell me more about conversation abc-123"

**Librarian:** *extracts topics, code snippets, decisions, and action items*

### Exporting Context

**User:** "Export the top 3 conversations about React to markdown"

**Librarian:** *identifies conversations, exports to markdown files*

### Creating Knowledge Bases

**User:** "Create a knowledge base from all conversations about my API project"

**Librarian:** *searches, selects relevant conversations, creates combined markdown*

### Complex Queries

**User:** "Find conversations from 2024 with more than 20 messages that discuss database schema, then create a knowledge base"

**Librarian:** *executes multi-step process with tools*

## Commands

While in the interactive chat:

- `/help` - Show available commands
- `/stats` - Display data statistics
- `/reset` - Clear conversation history
- `/save` - Save current session
- `/quit` - Exit

## How It Works

### Architecture

```
User Query
    ↓
AI Librarian (Claude)
    ↓
Tool Selection & Planning
    ↓
Execute Tools (search, export, etc.)
    ↓
Synthesize Results
    ↓
Natural Language Response
```

### Tool Chain Example

Query: "Find React conversations and export the best one"

1. **Tool: search_conversations**
   - Input: `{ query: "React", limit: 5 }`
   - Output: List of relevant conversations

2. **Tool: get_conversation_details**
   - Input: `{ uuid: "top-result-uuid" }`
   - Output: Detailed context analysis

3. **Tool: export_to_markdown**
   - Input: `{ uuid: "top-result-uuid" }`
   - Output: Markdown file ready for upload

### Fuzzy Search

The librarian uses FuseJS for intelligent fuzzy matching:
- Typo tolerance
- Partial matches
- Weighted scoring (name > summary > content)
- Multi-field search

## Use Cases

### 1. Migrating to Work Account

**Goal:** Find and package specific project context

```
You: "I need to move all conversations about the CMAC project to my work account"

Librarian: [searches, finds 12 conversations]

You: "Create a knowledge base from the top 5"

Librarian: [creates combined markdown file]

→ Upload the generated .md file to your work Claude Project
```

### 2. Research & Discovery

**Goal:** Understand past solutions

```
You: "What approaches did I discuss for user authentication?"

Librarian: [analyzes conversations, extracts patterns]
          [presents summary with links to specific conversations]
```

### 3. Code Reference

**Goal:** Find code snippets

```
You: "Show me conversations with TypeScript code from the last 6 months"

Librarian: [filters by date, code presence, language]
          [presents relevant conversations]

You: "Export the second one"

Librarian: [exports to markdown with code preserved]
```

### 4. Decision Tracking

**Goal:** Review key decisions

```
You: "What decisions did I make about database design?"

Librarian: [extracts key decisions from relevant conversations]
          [summarizes with context]
```

## Advanced Features

### Session Persistence

Sessions are automatically saved to `~/.claude-explorer/session.json`

Resume previous conversations:
```bash
npm run chat
# Automatically restores your last session
```

### Streaming Responses

Real-time streaming for better UX:
- See responses as they're generated
- Tool execution feedback
- Progress indicators

### Multi-Tool Chains

The librarian can use multiple tools in sequence:
1. Search for conversations
2. Analyze details
3. Export results
4. Create summaries

All orchestrated automatically based on your request.

## Tips for Best Results

### Be Specific
❌ "Find stuff about databases"
✅ "Find conversations about PostgreSQL schema design from 2024"

### Use Context
The librarian remembers your conversation:
```
You: "Find React conversations"
Librarian: [shows results]
You: "Export the first one"  ← References previous results
```

### Ask for Clarification
The librarian will ask if your request is ambiguous:
```
You: "Export conversations"
Librarian: "Which conversations would you like to export?
           Should I search for specific topics first?"
```

### Combine Operations
```
"Find authentication conversations, show me details on the top result,
then create a knowledge base from the top 3"
```

## Troubleshooting

### API Key Issues
```
❌ Error: ANTHROPIC_API_KEY environment variable not set
```
Solution: Create `.env` file or export environment variable

### No Results Found
- Try broader search terms
- Check date filters aren't too restrictive
- Use fuzzy matching (typos are OK!)

### Tool Execution Errors
- Ensure data files are in the correct location
- Check file permissions
- Verify data is properly loaded

## Comparison: Traditional CLI vs AI Librarian

### Traditional CLI
```bash
# Multiple steps, manual UUID tracking
claude-explorer search "authentication"
# Read through results...
# Copy UUID...
claude-explorer export abc-123 -f markdown
# Repeat for each conversation...
```

### AI Librarian
```
You: "Find authentication conversations and create a knowledge base from the best ones"
Librarian: [does everything automatically]
```

## Integration with Workflows

### Automation

The librarian can be integrated into scripts:

```bash
# Start librarian with specific query
echo "Find React conversations and export to ./exports/" | npm run chat
```

### Batch Processing

```
You: "Process all conversations about API design:
      1. Find them
      2. Extract key decisions
      3. Create a summary document"
```

The librarian executes the entire workflow.

## Future Enhancements

Planned features:
- Custom tool plugins
- Integration with MCP servers
- Advanced analytics
- Conversation clustering
- Semantic search
- Multi-language support

## Privacy & Security

- API calls are made directly to Anthropic
- No conversation data is sent except what's needed for your queries
- Sessions stored locally in your home directory
- API key stored in environment variables (not in code)

## Performance

- Initial load: ~2-5 seconds (building indices)
- Search: < 1 second for 700+ conversations
- Export: < 1 second per conversation
- Streaming: Real-time response generation

## Cost

The AI Librarian uses Claude 3.5 Sonnet:
- ~$3 per million input tokens
- ~$15 per million output tokens

Typical costs:
- Simple query: < $0.01
- Complex multi-tool operation: $0.02-0.05
- Extended conversation: $0.10-0.20

---

**Ready to try it?**

```bash
export ANTHROPIC_API_KEY=your-key
cd claude-explorer
npm run chat
```

Ask: *"What can you help me with?"*
