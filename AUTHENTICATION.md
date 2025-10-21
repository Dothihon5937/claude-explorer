# Authentication Guide

Claude Explorer now uses OAuth authentication similar to Claude Code, connecting directly with your claude.ai account.

## Setup

### 1. Login

```bash
npm run login
```

This will:
1. Prompt for authentication
2. Store credentials securely in `~/.claude-explorer/auth.json`
3. Enable access to Claude models (Sonnet 4.5, Haiku 4.5)

### 2. Verify

Your authentication status is shown when you start the AI librarian:

```bash
npm run chat
✓ Authenticated
```

## Models Available

### Claude Sonnet 4.5
- **Best for**: Complex reasoning, multi-step tasks, analysis
- **Speed**: Moderate
- **Cost**: $3-15 per million tokens
- **Max tokens**: 8,192
- **Used for**: AI librarian chat, complex queries

### Claude Haiku 4.5
- **Best for**: Simple searches, quick exports, listings
- **Speed**: Fast (3x faster than Sonnet)
- **Cost**: $0.8-4 per million tokens
- **Max tokens**: 8,192
- **Used for**: Direct tool calls, simple operations

## Automatic Model Selection

The AI librarian automatically selects the best model for your query:

```javascript
// Complex multi-step query → Sonnet 4.5
"Find React conversations and create a knowledge base"

// Simple search → Could use Haiku 4.5 (but defaults to Sonnet for chat)
"Search for database"
```

## Authentication Flow

```
┌─────────────────────────────────────────┐
│  npm run login                          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Enter API Key (temporary)              │
│  OR                                     │
│  OAuth Flow (coming soon)               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Credentials stored in                  │
│  ~/.claude-explorer/auth.json           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Use npm run chat                       │
│  Automatically authenticated            │
└─────────────────────────────────────────┘
```

## Temporary API Key (Until OAuth is complete)

For now, you can authenticate with an API key:

1. Get key from: https://console.anthropic.com/
2. Run: `npm run login`
3. Enter your API key when prompted
4. Key is stored locally and expires in 30 days

## Full OAuth (Coming Soon)

Once OAuth is fully implemented, you'll be able to:

1. Run `npm run login`
2. Browser opens to claude.ai
3. Authorize the application
4. Automatically authenticated!

This will match Claude Code's authentication exactly.

## Security

### Where are credentials stored?

```
~/.claude-explorer/auth.json
```

This file contains:
- Session key or OAuth token
- Organization ID (if applicable)
- Expiration timestamp

### Permissions

The file is created with read/write permissions for your user only.

### Logout

To clear authentication:

```bash
rm ~/.claude-explorer/auth.json
```

Or programmatically from within the chat:

```
/logout
```

## Troubleshooting

### "Not authenticated" error

```bash
npm run login
```

### Authentication expired

Sessions expire after 30 days. Simply run login again:

```bash
npm run login
```

### Wrong credentials

Logout and login again:

```bash
# Remove auth file
rm ~/.claude-explorer/auth.json

# Login again
npm run login
```

### Check status

Start the chat to see your authentication status:

```bash
npm run chat

✓ Authenticated
  Expires: 2025-02-20 10:30:00
  Organization: your-org-id
```

## API Usage & Costs

With proper authentication, you have access to:

- **Sonnet 4.5**: Advanced reasoning
- **Haiku 4.5**: Fast operations

### Typical Costs

| Operation | Model | Tokens | Cost |
|-----------|-------|--------|------|
| Simple search | Haiku | 500 in, 200 out | ~$0.001 |
| Complex query | Sonnet | 2000 in, 1000 out | ~$0.02 |
| Extended chat | Sonnet | 5000 in, 3000 out | ~$0.06 |

Much more affordable than older models!

## Comparison: API Key vs OAuth

| Feature | API Key (Current) | OAuth (Coming) |
|---------|------------------|----------------|
| Setup | Manual entry | Browser auth |
| Expiration | 30 days | Longer lived |
| Rotation | Manual | Automatic |
| Organization | Optional | Automatic |
| Security | Good | Excellent |

## Multiple Accounts

You can switch between accounts by logging out and back in:

```bash
# Logout
rm ~/.claude-explorer/auth.json

# Login with different account
npm run login
```

## Organization Support

If you're part of an organization:

1. Login will detect your organization
2. Store organization ID in auth.json
3. All API calls include org header
4. Access to org-specific features

---

## Quick Reference

```bash
# Setup
npm run login

# Verify
npm run chat

# Logout
rm ~/.claude-explorer/auth.json

# Check auth file
cat ~/.claude-explorer/auth.json
```

**Note**: Full OAuth implementation coming soon to match Claude Code exactly!
