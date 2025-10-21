# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install (Already Done!)

The dependencies are already installed and the project is built.

### 2. Try the CLI

From the directory containing your Claude export files (`conversations.json`, `projects.json`, `users.json`):

```bash
# View statistics about your data
node claude-explorer/dist/cli/index.js stats

# Search for conversations
node claude-explorer/dist/cli/index.js search "your search term"

# List conversations
node claude-explorer/dist/cli/index.js list conversations --limit 10

# Export a conversation (get UUID from search/list)
node claude-explorer/dist/cli/index.js export <UUID> -f markdown -o output.md
```

### 3. Start the Web UI

```bash
cd claude-explorer
npm run web
```

Then open **http://localhost:3000** in your browser!

## 📋 Common Tasks

### Find Conversations About a Topic
```bash
node claude-explorer/dist/cli/index.js search "topic name" --limit 20
```

### Export for Work Claude Account

**Option 1: Single Conversation**
```bash
# Search for the conversation
node claude-explorer/dist/cli/index.js search "project name"

# Export to markdown (perfect for Claude Projects)
node claude-explorer/dist/cli/index.js export <UUID> -f markdown -o knowledge.md
```

**Option 2: Multiple Related Conversations**
1. Start web UI: `npm run web`
2. Search for conversations
3. Select multiple conversations using checkboxes
4. Click "Export Selected" to download as ZIP bundle
5. Extract and upload markdown files to your work Claude Project

### Browse All Conversations
```bash
# List recent conversations
node claude-explorer/dist/cli/index.js list conversations --sort date --limit 20

# List conversations with most messages
node claude-explorer/dist/cli/index.js list conversations --sort messages --limit 10
```

### Export Everything from a Date Range
Use the web UI:
1. Start server: `npm run web`
2. Use search to filter conversations
3. Select all relevant ones
4. Export as bundle

## 💡 Pro Tips

### For Migrating to Work Account

1. **Identify Important Context**
   - Search for project names, client names, or technologies
   - Sort by message count to find substantial conversations

2. **Export as Markdown**
   - Markdown format works perfectly with Claude Projects
   - Upload directly to Project Knowledge

3. **Organize by Topic**
   - Create separate exports for different topics/projects
   - Name files clearly: `project-auth-implementation.md`

### Best Export Formats

- **Markdown** - For Claude Projects knowledge (recommended)
- **JSON** - For programmatic processing or archiving
- **Bundle (ZIP)** - For backing up multiple conversations

## 🔧 Configuration

### Change Web Server Port
```bash
PORT=8080 npm run web
```

### Point to Different Data Location
```bash
node claude-explorer/dist/cli/index.js stats -p /path/to/export/folder
```

## 🎯 Example Workflow

### Scenario: Moving Project Documentation to Work Account

```bash
# 1. Find all conversations about the project
node claude-explorer/dist/cli/index.js search "ProjectName" --limit 50

# 2. Review the UUIDs and identify the most relevant ones

# 3. Export each as markdown
node claude-explorer/dist/cli/index.js export <UUID-1> -f markdown -o project-setup.md
node claude-explorer/dist/cli/index.js export <UUID-2> -f markdown -o project-api.md
node claude-explorer/dist/cli/index.js export <UUID-3> -f markdown -o project-database.md

# 4. Upload these .md files to your work Claude Project as knowledge docs
```

OR use the Web UI for easier selection and batch export!

## 📚 Need More Help?

See the full [README.md](README.md) for comprehensive documentation.

## 🎉 You're Ready!

Your Claude Explorer is fully set up and tested. Start exploring your conversations!
