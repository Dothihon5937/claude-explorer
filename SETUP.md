# Setup Guide

Complete setup instructions for Claude Explorer, including AI Assistant functionality.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Getting Your Claude.ai Data](#getting-your-claudeai-data)
- [Setting Up the AI Assistant](#setting-up-the-ai-assistant)
- [Docker Setup](#docker-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- **Node.js 18 or higher** - [Download](https://nodejs.org/)
- **Claude.ai account** - [Sign up](https://claude.ai)

### Optional (for AI Assistant)
- **Claude Code CLI** - For AI-powered chat features in the web UI

## Installation

### 1. Clone and Build

```bash
git clone https://github.com/yourusername/claude-explorer.git
cd claude-explorer
npm install
npm run build
```

### 2. Verify Installation

```bash
npm run cli stats
```

If you see "Failed to load data", you need to get your Claude.ai export data (see next section).

## Getting Your Claude.ai Data

### Export from Claude.ai

1. Visit [claude.ai](https://claude.ai)
2. Click your **profile icon** in the bottom-left corner
3. Select **Settings**
4. Navigate to **Data & Privacy** tab
5. Click **"Request data export"**
6. Wait for the export email (usually arrives within minutes)
7. Download the ZIP file
8. Extract the contents to a folder

### What's Included in Your Export

Your export ZIP contains:
- `conversations.json` - All conversations and messages
- `projects.json` - All Claude Projects
- `users.json` - User profile information
- `attachments/` - Any files you uploaded (if applicable)

### Directory Structure

After extraction, your folder should look like:

```
my-claude-export/
├── conversations.json
├── projects.json
├── users.json
└── attachments/ (optional)
```

### Using Your Export

**Option 1: Web UI with Upload Feature (Easiest)**

1. Start the web server:
   ```bash
   npm run web
   ```

2. Open http://localhost:3000 in your browser

3. Click **"Choose File"** and select your export ZIP

4. Your data loads automatically!

**Option 2: Command Line**

Place the extracted files in a directory and point Claude Explorer to it:

```bash
# From the extraction directory
npm run cli stats

# Or specify the path
npm run cli stats -p /path/to/export
```

**Option 3: Docker**

See [Docker Setup](#docker-setup) below.

## Setting Up the AI Assistant

The AI Assistant feature in the web UI provides natural language querying of your conversations. This feature requires **Claude Code CLI**.

### What is Claude Code?

Claude Code is Anthropic's official CLI tool for interacting with Claude. It provides:
- Secure authentication with your Claude.ai account
- Access to the latest Claude models (Sonnet 4.5, Haiku 4.5)
- Headless mode for programmatic access

### Installing Claude Code

#### macOS / Linux

```bash
# Using Homebrew (macOS)
brew install anthropics/tap/claude-code

# Or download directly
curl -fsSL https://cli.anthropic.com/install.sh | sh
```

#### Windows

```powershell
# Using Scoop
scoop bucket add anthropic https://github.com/anthropics/scoop-bucket.git
scoop install claude-code

# Or download from releases
# Visit: https://github.com/anthropics/claude-code/releases
```

### Authenticating Claude Code

After installing Claude Code, authenticate it:

```bash
# Login to Claude Code
claude login
```

This will:
1. Open your browser to claude.ai
2. Prompt you to authorize the CLI
3. Save credentials securely to `~/.claude/` directory

**Verify Authentication:**

```bash
claude --version
```

You should see the Claude Code version number.

### Enabling AI Assistant in Web UI

Once Claude Code is installed and authenticated:

1. Restart your web server if it's running:
   ```bash
   npm run web
   ```

2. Open http://localhost:3000

3. Click the **🤖 AI Assistant** tab

4. The status badge should show:
   - ✅ **Authenticated** (green) - Claude Code is ready
   - ❌ **Not Authenticated** (red) - Claude Code not set up

### Using the AI Assistant

Example queries:
- "Find conversations about React from 2024"
- "Show me all conversations with more than 50 messages"
- "Export conversations about TypeScript as markdown"
- "Create a knowledge base bundle about database design"
- "What topics do I discuss most frequently?"

The AI Assistant uses Claude Sonnet 4.5 for complex reasoning and can:
- Search your conversations
- Filter by criteria
- Export in multiple formats
- Create knowledge bundles
- Analyze patterns and trends

## Docker Setup

### Quick Start with Docker Compose

1. **Update `docker-compose.yml`** with your export path:

   ```yaml
   volumes:
     - /path/to/your/claude-export:/data:ro
   ```

   **Windows Example:**
   ```yaml
   volumes:
     - C:/Users/YourName/Documents/claude-export:/data:ro
   ```

2. **Build and start:**

   ```bash
   docker-compose up -d
   ```

3. **Access the UI:**

   Open http://localhost:3000

### Docker CLI Alternative

```bash
# Build the image
docker build -t claude-explorer .

# Run the container
docker run -d \
  --name claude-explorer \
  -p 3000:3000 \
  -v "/path/to/your/claude-export:/data:ro" \
  -e DATA_PATH=/data \
  claude-explorer

# View logs
docker logs -f claude-explorer

# Stop
docker stop claude-explorer
docker rm claude-explorer
```

### Docker with File Upload

If you use the upload feature in the web UI, uploaded data is stored temporarily inside the container. To persist uploads across container restarts:

```yaml
volumes:
  - /path/to/your/claude-export:/data:ro
  - claude-explorer-uploads:/tmp/claude-explorer-uploads

volumes:
  claude-explorer-uploads:
```

### Docker Notes

- **Read-only mount:** Data is mounted with `:ro` flag for security
- **No AI Assistant in Docker:** Claude Code authentication doesn't work inside containers (yet)
- **Port conflicts:** If port 3000 is in use, change the mapping: `"8080:3000"`
- **Health checks:** Container includes automatic health monitoring

See [DOCKER.md](DOCKER.md) for advanced Docker configuration.

## Troubleshooting

### "Failed to load data"

**Problem:** CLI or web UI can't find your data files.

**Solutions:**
1. Ensure you're in the directory with `conversations.json`, `projects.json`, `users.json`
2. Use `-p <path>` flag to specify data directory:
   ```bash
   npm run cli stats -p /path/to/data
   ```
3. For web UI, use the upload feature instead
4. Check file permissions (files should be readable)

### "AI Assistant not available"

**Problem:** Web UI shows "Not Authenticated" badge.

**Solutions:**
1. Install Claude Code:
   ```bash
   # macOS/Linux
   brew install anthropics/tap/claude-code

   # Windows
   scoop install claude-code
   ```

2. Authenticate Claude Code:
   ```bash
   claude login
   ```

3. Verify it's in your PATH:
   ```bash
   claude --version
   ```

4. Restart the web server:
   ```bash
   npm run web
   ```

### "Port 3000 already in use"

**Problem:** Web server won't start due to port conflict.

**Solutions:**
1. Use a different port:
   ```bash
   PORT=3001 npm run web
   ```

2. Or kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # macOS/Linux
   lsof -ti:3000 | xargs kill
   ```

### "Search returns no results"

**Problem:** Search doesn't find expected conversations.

**Causes:**
- Conversations might not have messages (check "Only with messages" filter)
- Search terms might be too specific
- Date filters might be too restrictive

**Solutions:**
1. Try broader search terms
2. Clear all filters
3. Check conversation has actual message content:
   ```bash
   npm run cli list conversations --limit 5
   ```

### "Upload fails" / "Invalid ZIP file"

**Problem:** File upload in web UI fails.

**Solutions:**
1. Ensure you're uploading the original Claude.ai export ZIP (not extracted)
2. Check ZIP file isn't corrupted (try extracting manually first)
3. Verify ZIP contains required files:
   - conversations.json
   - projects.json
   - users.json
4. Check file size (must be under 500MB)
5. Look at browser console for detailed errors

### Docker container won't start

**Problem:** `docker-compose up` fails or container exits immediately.

**Solutions:**
1. Check logs:
   ```bash
   docker-compose logs claude-explorer
   ```

2. Verify volume path exists:
   ```bash
   ls -la /path/to/your/claude-export
   ```

3. Check port isn't in use:
   ```bash
   # Windows
   netstat -ano | findstr :3000

   # macOS/Linux
   lsof -i :3000
   ```

4. Rebuild the image:
   ```bash
   docker-compose up -d --build
   ```

### Permission denied errors (Linux/Mac)

**Problem:** Can't read data files.

**Solution:**
```bash
chmod -R 755 /path/to/claude-export
```

### Claude Code authentication expired

**Problem:** AI Assistant stops working after some time.

**Solution:**
```bash
# Re-authenticate
claude login
```

Claude Code sessions typically last 30+ days.

## Environment Variables

Create a `.env` file in the project root for custom configuration:

```bash
# Web server port (default: 3000)
PORT=3000

# Data path (optional, can be set via CLI or upload)
DATA_PATH=/path/to/claude-export

# Node environment
NODE_ENV=production
```

## Next Steps

After setup is complete:

1. **Browse conversations:** Start the web UI and explore your data
2. **Try search:** Use the search bar to find specific topics
3. **Export content:** Export conversations as Markdown or JSON
4. **Use AI Assistant:** Ask questions about your conversation history
5. **Create knowledge bases:** Bundle related conversations for Claude Projects

For detailed usage instructions, see [README.md](README.md).

## Getting Help

- **Documentation:** Check [README.md](README.md) for usage examples
- **Docker issues:** See [DOCKER.md](DOCKER.md)
- **Authentication:** See [AUTHENTICATION.md](AUTHENTICATION.md)
- **Issues:** Report bugs on [GitHub Issues](https://github.com/yourusername/claude-explorer/issues)
- **Help in UI:** Click the **?** button in the web UI for contextual help

---

**Need more help?** Open an issue on GitHub with:
- Your operating system
- Node.js version (`node --version`)
- Error messages
- Steps to reproduce the problem
