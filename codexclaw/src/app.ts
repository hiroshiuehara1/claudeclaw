import { loadConfig, type AppConfig } from "./core/config.js";
import { ChatService } from "./core/chat-service.js";
import { ClaudeAdapter, CodexAdapter } from "./core/adapters/index.js";
import { SqliteStore } from "./core/session/index.js";
import { WebServer } from "./interfaces/web/server.js";

export interface AppContext {
  config: AppConfig;
  store: SqliteStore;
  service: ChatService;
  web: WebServer;
}

export function createApp(config = loadConfig()): AppContext {
  const store = new SqliteStore(config.dbPath);
  const service = new ChatService(config, store, {
    codex: new CodexAdapter(),
    claude: new ClaudeAdapter()
  });
  const web = new WebServer(config, service);

  return {
    config,
    store,
    service,
    web
  };
}
