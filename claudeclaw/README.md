# ClaudeClaw

Open-source personal AI assistant with first-class Claude and OpenAI support. Runs locally with a streaming engine, persistent memory, extensible skill system, and multiple interfaces (CLI, Web UI, Telegram, Discord, Slack).

## Features

- **Dual-backend** — Claude (Anthropic SDK) and OpenAI with streaming responses
- **Memory** — SQLite-backed conversation history, persistent facts, and vector-search semantic recall
- **Skills** — Pluggable tool system (bundled, npm, or local skills) with marketplace
- **CLI** — Interactive REPL and one-shot mode
- **Web UI** — Chat interface with streaming, served via Fastify
- **Chat platforms** — Telegram, Discord, and Slack adapters
- **Browser control** — Playwright-powered web automation skill

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

### Web UI

The web UI is served automatically at `http://127.0.0.1:3100` when you start the web server.

### Chat Platforms

```bash
# Start a Telegram bot (requires CLAW_TELEGRAM_TOKEN)
npx claw serve telegram

# Start a Discord bot (requires CLAW_DISCORD_TOKEN)
npx claw serve discord

# Start a Slack bot (requires CLAW_SLACK_BOT_TOKEN + CLAW_SLACK_APP_TOKEN)
npx claw serve slack
```

Install the platform SDK you need:
```bash
npm install telegraf        # for Telegram
npm install discord.js      # for Discord
npm install @slack/bolt     # for Slack
```

### Skill Marketplace

```bash
# Search for community skills
npx claw skill search "code"

# Install a skill from npm
npx claw skill install my-skill

# Remove a skill
npx claw skill remove my-skill

# Scaffold a new skill project
npx claw skill create my-new-skill

# List registered skills
npx claw skill list
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
| `CLAW_TELEGRAM_TOKEN` | Telegram bot token | — |
| `CLAW_DISCORD_TOKEN` | Discord bot token | — |
| `CLAW_SLACK_BOT_TOKEN` | Slack bot token | — |
| `CLAW_SLACK_APP_TOKEN` | Slack app-level token | — |
| `CLAW_SLACK_SIGNING_SECRET` | Slack signing secret | — |
| `CLAW_VECTOR_MEMORY_ENABLED` | Enable vector-search memory | `false` |

## Skills

Three bundled skills are included:

- **git-workflow** — git status, diff, log, and shell access
- **code-review** — file reading, directory listing, and diff review
- **browser-control** — navigate, screenshot, click, type, extract text, evaluate JS (requires `playwright`)

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

**Vector search**: Enable with `CLAW_VECTOR_MEMORY_ENABLED=true` (requires `OPENAI_API_KEY` for embeddings). Past conversations are semantically searched and injected as context, enabling recall across sessions.

Say "remember ..." in chat to persist facts across sessions.

## Development

```bash
npm run dev          # watch mode build
npm test             # run tests (vitest, 71 tests)
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
│   │   ├── memory/                # SQLite store, vector store, embedder
│   │   ├── skill/                 # Types, loader, registry, marketplace
│   │   └── tools/                 # Built-in tools (git, file-ops, shell)
│   ├── interfaces/
│   │   ├── cli/                   # Commander.js + readline REPL
│   │   ├── web/                   # Fastify REST + WebSocket + static UI
│   │   └── chat/                  # Telegram, Discord, Slack adapters
│   └── utils/                     # Logger, errors, stream helpers
├── skills/                        # Bundled skills (git-workflow, code-review, browser-control)
├── web/                           # Web UI SPA (HTML/CSS/JS)
└── test/                          # 71 tests across 11 files
```

## License

MIT
