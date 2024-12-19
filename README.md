# TestGen - AI-Powered Test Generator

TestGen is a powerful CLI tool that automatically generates comprehensive unit tests for JavaScript and TypeScript projects using AI. It analyzes your code and generates Jest-based tests with proper mocking, edge cases, and type safety.

## Features

- 🤖 AI-powered test generation using state-of-the-art LLMs
- 🎯 Support for both JavaScript and TypeScript
- ✨ Framework-aware testing:
  - Node.js (plain Node.js applications)
  - NestJS
  - Express
  - React
  - Next.js
- 🔄 Intelligent mocking and dependency handling
- 📝 Comprehensive test coverage
- 🛠️ Configurable via `.testgenrc` or `package.json`
- 🔁 Self-healing tests with automatic error fixing
- 📊 Coverage-driven test enhancement

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

3. Clean up debug files and optionally generated test files:

```bash
# Clean only debug files (requires DEBUG_MODE=true)
DEBUG_MODE=true testgen clean

# Clean debug files without DEBUG_MODE mode
testgen clean --force

# Clean both debug files and generated tests
testgen clean --tests

# Clean everything without DEBUG_MODE mode
testgen clean --force --tests
```

## Configuration

TestGen can be configured through a `.testgenrc` file or in your `package.json` under the `testgen` key:

```json
{
  "language": "typescript",
  "framework": "nodejs",
  "testFilePattern": "${filename}.test.${ext}",
  "llm": {
    "provider": "anthropic",
    "model": "claude-3-sonnet-20240229",
    "temperature": 0.7,
    "maxTokens": 4096
  },
  "coverage": {
    "minimum": {
      "statements": 80,
      "branches": 80,
      "functions": 80,
      "lines": 80
    },
    "maxEnhancementAttempts": 3
  },
  "healing": {
    "strategy": "conservative",
    "maxRetriesForFix": 3,
    "timeoutPerAttempt": 30000
  }
}
```

### Configuration Options

- `language`: Target language ("javascript" | "typescript")
- `framework`: Project framework ("nodejs" | "nestjs" | "express" | "fastify" | "react" | "nextjs")
- `testFilePattern`: Pattern for generated test files
- `llm`: LLM provider configuration
  - `provider`: LLM provider ("anthropic" | "openai" | "google" | "qwen")
  - `model`: Specific model to use (optional)
  - `temperature`: Model temperature (0-2)
  - `maxTokens`: Maximum tokens per request
- `coverage`: Test coverage thresholds (optional)
  - `minimum`: Minimum coverage thresholds
    - `statements`: Statement coverage threshold
    - `branches`: Branch coverage threshold
    - `functions`: Function coverage threshold
    - `lines`: Line coverage threshold
  - `maxEnhancementAttempts`: Maximum enhancement attempts
- `healing`: Test healing configuration (optional)
  - `strategy`: Healing strategy ("conservative" | "aggressive")
  - `maxRetriesForFix`: Maximum retries for fixing tests
  - `timeoutPerAttempt`: Timeout per healing attempt (ms)

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

For Google:

```bash
GOOGLE_API_KEY=your_api_key
```

For Qwen (via Hugging Face):

```bash
HUGGINGFACE_API_KEY=your_api_key
```

For Development:

```bash
DEBUG_MODE=true # Enables debug mode and clean command
```

## Commands

- `testgen init` - Initialize TestGen configuration
- `testgen generate <file> [options]` - Generate tests for a file
  - `-m, --method <method>` - Generate tests for a specific method
  - `-p, --provider <provider>` - Choose LLM provider
  - `-k, --api-key <key>` - Provide API key directly
  - `-f, --force` - Skip test setup verification
- `testgen clean [options]` - Remove debug and test files
  - `-f, --force` - Force cleanup without DEBUG_MODE mode
  - `-t, --tests` - Also remove generated test files

## Project Structure

```
src/
├── cli/               # CLI commands and types
├── config/            # Configuration management
├── core/             # Core functionality
│   ├── bundler/      # Code bundling and analysis
│   ├── generator/    # Test generation logic
│   ├── test-runner/  # Test execution
│   ├── test-healer/  # Test healing
│   ├── coverage/     # Coverage management
│   └── test-setup/   # Test setup verification
├── llm/              # LLM client implementations
├── prompts/          # LLM prompt templates
│   └── frameworks/   # Framework-specific prompts
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
