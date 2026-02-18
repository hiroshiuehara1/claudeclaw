class ChatApp {
  constructor() {
    this.messagesEl = document.getElementById("messages");
    this.form = document.getElementById("chat-form");
    this.input = document.getElementById("chat-input");
    this.sendBtn = document.getElementById("send-btn");
    this.newSessionBtn = document.getElementById("new-session");
    this.sidebarNewBtn = document.getElementById("sidebar-new-session");
    this.sidebarToggle = document.getElementById("sidebar-toggle");
    this.exportBtn = document.getElementById("export-btn");
    this.sessionListEl = document.getElementById("session-list");
    this.sidebar = document.getElementById("sidebar");
    this.currentResponseEl = null;
    this.currentResponseText = "";
    this.ws = null;
    this.sessionId = null;

    // Configure marked with highlight.js
    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
    });

    this.connect();
    this.bindEvents();
    this.loadSessions();
  }

  connect() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    this.ws = new WebSocket(`${protocol}//${location.host}/api/chat/ws`);

    this.ws.onopen = () => {
      this.sendBtn.disabled = false;
    };

    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        this.handleEvent(event);
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.sendBtn.disabled = true;
      setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = () => {
      this.ws.close();
    };
  }

  bindEvents() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.send();
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    this.newSessionBtn.addEventListener("click", () => this.newSession());
    this.sidebarNewBtn.addEventListener("click", () => this.newSession());

    this.sidebarToggle.addEventListener("click", () => {
      this.sidebar.classList.toggle("open");
    });

    this.exportBtn.addEventListener("click", () => {
      if (this.sessionId) {
        window.open(`/api/sessions/${this.sessionId}/export?format=markdown`, "_blank");
      }
    });
  }

  newSession() {
    this.messagesEl.innerHTML = "";
    this.sessionId = null;
    this.ws.close();
  }

  send() {
    const text = this.input.value.trim();
    if (!text || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const model = document.getElementById("model-input").value || undefined;
    this.addMessage("user", text);
    this.startAssistantMessage();

    const msg = { prompt: text, model };
    if (this.sessionId) msg.sessionId = this.sessionId;
    this.ws.send(JSON.stringify(msg));
    this.input.value = "";
    this.input.focus();
  }

  handleEvent(event) {
    switch (event.type) {
      case "text":
        this.appendToCurrentResponse(event.text || "");
        break;
      case "tool_use":
        this.appendToCurrentResponse(
          `\n[using tool: ${event.toolCall?.name}]\n`
        );
        break;
      case "done":
        this.finalizeResponse();
        break;
      case "error":
        this.finalizeResponse();
        this.addMessage("error", `Error: ${event.error}`);
        break;
    }
  }

  addMessage(role, text) {
    const el = document.createElement("div");
    el.className = `message ${role}`;
    if (role === "assistant") {
      el.innerHTML = '<div class="markdown-content">' + marked.parse(text) + "</div>";
    } else {
      el.textContent = text;
    }
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
  }

  startAssistantMessage() {
    const el = document.createElement("div");
    el.className = "message assistant streaming";
    el.innerHTML = '<div class="markdown-content"></div>';
    this.messagesEl.appendChild(el);
    this.currentResponseEl = el;
    this.currentResponseText = "";
    this.scrollToBottom();
  }

  appendToCurrentResponse(text) {
    if (this.currentResponseEl) {
      this.currentResponseText += text;
      const contentEl = this.currentResponseEl.querySelector(".markdown-content");
      if (contentEl) {
        contentEl.innerHTML = marked.parse(this.currentResponseText);
      }
      this.scrollToBottom();
    }
  }

  finalizeResponse() {
    if (this.currentResponseEl) {
      this.currentResponseEl.classList.remove("streaming");
      // Re-highlight code blocks
      this.currentResponseEl.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
      this.currentResponseEl = null;
      this.currentResponseText = "";
      this.loadSessions();
    }
  }

  scrollToBottom() {
    const container = document.getElementById("chat-container");
    container.scrollTop = container.scrollHeight;
  }

  async loadSessions() {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const data = await res.json();
      this.renderSessionList(data.sessions || []);
    } catch {
      // ignore fetch errors
    }
  }

  renderSessionList(sessions) {
    this.sessionListEl.innerHTML = "";
    for (const s of sessions) {
      const li = document.createElement("li");
      li.className = "session-item";
      if (this.sessionId === s.id) li.classList.add("active");
      li.innerHTML = `<span class="session-id">${s.id}</span><span class="session-count">${s.message_count} msgs</span>`;
      li.addEventListener("click", () => this.loadSession(s.id));
      this.sessionListEl.appendChild(li);
    }
  }

  async loadSession(id) {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      this.sessionId = id;
      this.messagesEl.innerHTML = "";
      for (const msg of data.messages || []) {
        this.addMessage(msg.role, msg.content);
      }
      // Highlight active session
      this.sessionListEl.querySelectorAll(".session-item").forEach((el) => {
        el.classList.remove("active");
      });
      const items = this.sessionListEl.querySelectorAll(".session-item");
      for (const item of items) {
        if (item.querySelector(".session-id")?.textContent === id) {
          item.classList.add("active");
        }
      }
      // Close sidebar on mobile
      this.sidebar.classList.remove("open");
    } catch {
      // ignore fetch errors
    }
  }
}

new ChatApp();
