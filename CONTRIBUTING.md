# Contributing to Claude Explorer

Thank you for your interest in contributing to Claude Explorer! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (OS, Node.js version, etc.)
- Any relevant logs or screenshots

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

- A clear description of the feature
- Use cases and benefits
- Any implementation ideas you have
- Examples from similar tools (if applicable)

### Pull Requests

1. **Fork the repository** and create a branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** as needed
5. **Submit a pull request** with a clear description

#### Pull Request Guidelines

- Keep changes focused and atomic
- Write clear commit messages
- Include tests for new features
- Update README.md if adding features
- Follow the existing code style
- Ensure all tests pass

## Development Setup

### Prerequisites

- Node.js 18 or higher
- Git
- A code editor (VS Code recommended)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/yourusername/claude-explorer.git
cd claude-explorer

# Add upstream remote
git remote add upstream https://github.com/originalowner/claude-explorer.git

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Project Structure

```
src/
├── core/           # Core library (parser, indexer, exporters)
├── cli/            # Command-line interface
└── web/            # Web server and frontend
```

### Building

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run specific test file
npm test -- path/to/test.ts
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types that may be useful to consumers

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multiline objects/arrays
- Use meaningful variable and function names
- Comment complex logic

### Example

```typescript
// Good
interface ConversationFilter {
  from?: Date;
  to?: Date;
  minMessages?: number;
}

function filterConversations(
  conversations: Conversation[],
  filter: ConversationFilter
): Conversation[] {
  return conversations.filter((conv) => {
    if (filter.from && conv.created_at < filter.from) return false;
    if (filter.to && conv.created_at > filter.to) return false;
    if (filter.minMessages && conv.chat_messages.length < filter.minMessages) {
      return false;
    }
    return true;
  });
}

// Bad
function filterConvs(convs: any, f: any): any {
  return convs.filter((c: any) => {
    if (f.from && c.created_at < f.from) return false;
    // ... more logic without comments
  });
}
```

### Commit Messages

Use clear, descriptive commit messages:

```
Add fuzzy search feature

- Implement FuseJS integration
- Add fuzzy search option to CLI
- Update README with fuzzy search examples
```

Format:
- Use imperative mood ("Add feature" not "Added feature")
- First line: brief summary (50 chars or less)
- Blank line
- Detailed description if needed (wrap at 72 chars)

## Areas for Contribution

### High Priority

- **Tests**: Expand test coverage
- **Documentation**: Improve guides and examples
- **Performance**: Optimize search and indexing
- **Bug fixes**: Check the issues page

### Feature Ideas

- Analytics dashboard with visualizations
- Custom export templates
- Conversation tagging system
- Advanced search filters
- GraphQL API
- Browser extension for direct exports

### Documentation

- Improve installation guides
- Add video tutorials
- Create example use cases
- Translate documentation

## Testing Guidelines

### Unit Tests

- Test individual functions and modules
- Mock external dependencies
- Cover edge cases and error conditions

### Integration Tests

- Test feature workflows end-to-end
- Use real (small) test data
- Verify CLI commands work correctly

### Test Data

- Keep test data minimal
- Don't commit real conversation data
- Use fixtures in `test/fixtures/`

## Release Process

Releases are handled by project maintainers:

1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Tag release in git
4. Publish to npm (if applicable)

## Questions?

Feel free to:

- Open an issue for questions
- Join discussions on GitHub
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Claude Explorer! Your help makes this project better for everyone.
