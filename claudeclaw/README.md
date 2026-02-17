# ClaudeClaw

Open-source personal AI assistant with first-class Claude and OpenAI support. Runs locally with a streaming engine, persistent memory, extensible skill system, and multiple interfaces (CLI, Web, chat platforms).

## Features

- **Dual-backend** — Claude (Anthropic SDK) and OpenAI with streaming responses
- **Memory** — SQLite-backed conversation history and persistent facts
- **Skills** — Pluggable tool system (bundled, npm, or local skills)
- **CLI** — Interactive REPL and one-shot mode
- **Web** — REST API and WebSocket streaming via Fastify
- **Chat platforms** — Base adapter for Telegram, Discord, Slack (Phase 2)

## Quick Start

```bash
npm install
cp .env.example .env   # add your API key(s)
npm run build
```

### CLI

```bash
# One-shot
npx claw run "explain what a monad is"

# Interactive chat
npx claw chat

# Use OpenAI instead of Claude
npx claw run --backend openai "hello"
```

### Web Server

```bash
# Start the server (default: http://127.0.0.1:3100)
node -e "
  import('./dist/index.js').then(async ({ loadConfig, Engine }) => {
    const { WebAdapter } = await import('./dist/index.js');
    const engine = new Engine({ config: loadConfig() });
    const web = new (await import('./src/interfaces/web/server.js')).WebAdapter();
    await web.start(engine);
  });
"

# REST
curl -X POST http://localhost:3100/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "hello"}'

# WebSocket — connect to ws://localhost:3100/api/chat/ws
```

## Configuration

Config is loaded from environment variables and `~/.claudeclaw/config.json`.

| Variable | Description | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `CLAW_DEFAULT_BACKEND` | `claude` or `openai` | `claude` |
| `CLAW_LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` |
| `CLAW_DATA_DIR` | Data directory path | `~/.claudeclaw` |
| `CLAW_WEB_PORT` | Web server port | `3100` |

## Skills

Skills provide tools, MCP servers, and system prompt fragments. Two bundled skills are included:

- **git-workflow** — git status, diff, log, and shell access
- **code-review** — file reading, directory listing, and diff review

### Writing a Skill

```typescript
import { defineSkill } from "claudeclaw";

export default defineSkill(
  {
    name: "my-skill",
    version: "1.0.0",
    description: "Does something useful",
    permissions: ["fs:read"],
  },
  [
    {
      name: "my_tool",
      description: "A custom tool",
      inputSchema: { type: "object", properties: { input: { type: "string" } }, required: ["input"] },
      async execute(input) {
        return `Result: ${(input as any).input}`;
      },
    },
  ],
);
```

## Memory

SQLite database at `~/.claudeclaw/memory.db` stores:

- **messages** — conversation history per session
- **memories** — persistent facts and preferences
- **sessions** — session metadata

Say "remember ..." in chat to persist facts across sessions.

## Development

```bash
npm run dev          # watch mode build
npm test             # run tests (vitest)
npm run lint         # type check
```

## Project Structure

```
claudeclaw/
├── bin/claw.ts                    # CLI entry point
├── src/
│   ├── core/
│   │   ├── engine.ts              # Central orchestrator
│   │   ├── backend/               # Claude + OpenAI backends
│   │   ├── memory/                # SQLite store + manager
│   │   ├── skill/                 # Skill types, loader, registry
│   │   └── tools/                 # Built-in tools (git, file-ops, shell)
│   ├── interfaces/
│   │   ├── cli/                   # Commander.js + readline REPL
│   │   ├── web/                   # Fastify REST + WebSocket
│   │   └── chat/                  # Platform adapter base class
│   └── utils/                     # Logger, errors, stream helpers
├── skills/                        # Bundled first-party skills
└── test/                          # 30 tests
```

## License

MIT
