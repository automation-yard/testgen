# TestGen - AI-Powered Test Generator

TestGen is a powerful CLI tool that automatically generates comprehensive unit tests for JavaScript and TypeScript projects using AI. It analyzes your code and generates Jest-based tests with proper mocking, edge cases, and type safety.

## Features

- 🤖 AI-powered test generation using state-of-the-art LLMs
- 🎯 Support for both JavaScript and TypeScript
- ✨ Framework-aware testing (NestJS, Express, React, Next.js)
- 🔄 Intelligent mocking and dependency handling
- 📝 Comprehensive test coverage
- 🛠️ Configurable via `.testgenrc` or `package.json`

## Installation

```bash
npm install -g @automationyard/testgen
```

## Quick Start

1. Initialize TestGen in your project:

```bash
testgen init
```

2. Generate tests for a specific file or method:

```bash
testgen generate src/services/user.service.ts
testgen generate src/services/user.service.ts --method createUser
```

## Configuration

TestGen can be configured through a `.testgenrc` file or in your `package.json` under the `testgen` key:

```json
{
  "language": "typescript",
  "framework": "nestjs",
  "testFilePattern": "${filename}.test.${ext}",
  "llm": {
    "provider": "anthropic",
    "temperature": 0,
    "maxTokens": 4096
  },
  "coverage": {
    "statements": 80,
    "branches": 80,
    "functions": 80,
    "lines": 80
  }
}
```

### Configuration Options

- `language`: Target language ("javascript" | "typescript")
- `framework`: Project framework ("nestjs" | "express" | "fastify" | "react" | "nextjs")
- `testFilePattern`: Pattern for generated test files
- `llm`: LLM provider configuration
  - `provider`: LLM provider ("anthropic" | "openai")
  - `model`: Specific model to use (optional)
  - `temperature`: Model temperature (0-2)
  - `maxTokens`: Maximum tokens per request
- `coverage`: Test coverage thresholds (optional)
  - `statements`: Statement coverage threshold
  - `branches`: Branch coverage threshold
  - `functions`: Function coverage threshold
  - `lines`: Line coverage threshold

## Environment Variables

Required environment variables based on your chosen LLM provider:

For Anthropic:

```bash
ANTHROPIC_API_KEY=your_api_key
```

For OpenAI:

```bash
OPENAI_API_KEY=your_api_key
```

## Project Structure

```
src/
├── cli/               # CLI commands and types
├── config/            # Configuration management
├── core/             # Core functionality
│   ├── bundler/      # Code bundling and analysis
│   └── generator/    # Test generation logic
├── llm/              # LLM client implementations
├── prompts/          # LLM prompt templates
└── types/            # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
