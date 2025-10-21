# Changelog

## Version 2.0.0 - AI Librarian Release (2025-01-20)

### 🎉 Major Features

#### AI-Powered Natural Language Interface
- **AI Librarian Agent**: Conversational interface using Claude 3.5 Sonnet
- **Natural language queries**: Ask questions in plain English
- **Intelligent tool orchestration**: Automatic multi-step workflows
- **Streaming responses**: Real-time feedback with progress indicators
- **Session persistence**: Resume conversations across sessions

#### Enhanced Search Capabilities
- **Fuzzy Search**: FuseJS integration for typo-tolerant search
- **Advanced filtering**: Multi-criteria search (date, code, topics)
- **Weighted scoring**: Better relevance ranking
- **Suggestion system**: Auto-complete for common queries

#### Agent Tools
- `search_conversations` - Natural language search with filters
- `get_conversation_details` - Extract topics, decisions, code
- `get_stats` - Data statistics and analytics
- `list_recent_conversations` - Browse by recency or activity
- `export_to_markdown` - Export for Claude Projects
- `create_knowledge_base` - Combine multiple conversations
- `find_by_topic` - Topic-based search

#### Smart Context Extraction
- Topic detection with entity recognition
- Code snippet extraction by language
- Key decision identification
- Action item tracking
- Pattern matching for technical terms

### 📦 New Dependencies
- `@anthropic-ai/sdk` ^0.32.0 - Claude API integration
- `fuse.js` ^7.0.0 - Fuzzy search engine
- `dotenv` ^16.4.0 - Environment variable management

### 💻 New Commands
- `npm run chat` - Start AI librarian interactive mode
- `/help` - Show available commands in chat
- `/stats` - Display statistics in chat
- `/reset` - Clear conversation history
- `/save` - Save current session
- `/quit` - Exit librarian

### 📚 New Documentation
- `AI-LIBRARIAN.md` - Comprehensive guide to AI features
- `.env.example` - Environment configuration template
- Updated `README.md` with AI librarian quick start
- `CHANGELOG.md` - This file!

### 🔧 Improvements
- Better TypeScript types for tool definitions
- Public tool access for CLI integration
- Session storage in `~/.claude-explorer/`
- Improved error handling and user feedback
- Colorized CLI output with progress indicators

### 🐛 Bug Fixes
- Fixed readonly type conflicts in fuzzy search
- Corrected tool schema definitions for Anthropic SDK
- Improved tool result parsing
- Better error messages for API issues

## Version 1.0.0 - Initial Release

### Features
- Data parsing for Claude.ai exports
- Full-text search with lunr.js
- CLI interface with Commander.js
- Web UI with Express
- Multiple export formats (Markdown, JSON, ZIP)
- Filter engine for advanced queries
- Statistics and analytics
- Context extraction (basic)

### Core Components
- `ClaudeDataParser` - Parse export JSON files
- `SearchIndexer` - Full-text search indexing
- `FilterEngine` - Advanced filtering
- `ContextExtractor` - Extract topics and code
- Exporters (Markdown, JSON, Bundle)
- CLI commands (search, list, export, stats)
- Web server with REST API
- Interactive web UI

---

## Upgrade Notes

### From 1.x to 2.0

**Breaking Changes**: None - fully backward compatible!

**New Requirements**:
- Anthropic API key (for AI librarian features)
- Node.js 18+ (for better ES modules support)

**Migration Steps**:
1. `npm install` - Install new dependencies
2. `npm run build` - Rebuild project
3. Create `.env` file with `ANTHROPIC_API_KEY`
4. Run `npm run chat` to try AI librarian

**Optional**: Existing CLI and web commands work exactly as before.
