class ChatApp {
  constructor() {
    this.messagesEl = document.getElementById("messages");
    this.form = document.getElementById("chat-form");
    this.input = document.getElementById("chat-input");
    this.sendBtn = document.getElementById("send-btn");
    this.stopBtn = document.getElementById("stop-btn");
    this.newSessionBtn = document.getElementById("new-session");
    this.sidebarNewBtn = document.getElementById("sidebar-new-session");
    this.sidebarToggle = document.getElementById("sidebar-toggle");
    this.exportBtn = document.getElementById("export-btn");
    this.sessionListEl = document.getElementById("session-list");
    this.sidebar = document.getElementById("sidebar");
    this.typingIndicator = document.getElementById("typing-indicator");
    this.backendSelect = document.getElementById("backend-select");
    this.themeToggle = document.getElementById("theme-toggle");
    this.sessionSearch = document.getElementById("session-search");
    this.currentResponseEl = null;
    this.currentResponseText = "";
    this.ws = null;
    this.sessionId = null;
    this.streaming = false;
    this.allSessions = [];

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

    this.loadTheme();
    this.connect();
    this.bindEvents();
    this.loadSessions();
  }

  // --- Theme ---

  loadTheme() {
    const saved = localStorage.getItem("claw-theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
    this.updateThemeIcon();
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    if (next === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
    }
    localStorage.setItem("claw-theme", next);
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    this.themeToggle.innerHTML = isLight ? "&#9790;" : "&#9728;";
    this.themeToggle.title = isLight ? "Switch to dark mode" : "Switch to light mode";
  }

  // --- Connection ---

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
      this.setStreaming(false);
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

    this.stopBtn.addEventListener("click", () => {
      this.cancelStream();
    });

    this.themeToggle.addEventListener("click", () => {
      this.toggleTheme();
    });

    this.sessionSearch.addEventListener("input", () => {
      this.filterSessions();
    });
  }

  // --- Session search ---

  filterSessions() {
    const query = this.sessionSearch.value.trim().toLowerCase();
    if (!query) {
      this.renderSessionList(this.allSessions);
      return;
    }
    const filtered = this.allSessions.filter((s) =>
      s.id.toLowerCase().includes(query) ||
      (s.backend && s.backend.toLowerCase().includes(query)) ||
      (s.model && s.model.toLowerCase().includes(query))
    );
    this.renderSessionList(filtered);
  }

  // --- Streaming ---

  setStreaming(active) {
    this.streaming = active;
    if (active) {
      this.sendBtn.classList.add("hidden");
      this.stopBtn.classList.remove("hidden");
      this.typingIndicator.classList.remove("hidden");
    } else {
      this.sendBtn.classList.remove("hidden");
      this.stopBtn.classList.add("hidden");
      this.typingIndicator.classList.add("hidden");
    }
  }

  cancelStream() {
    if (this.sessionId) {
      fetch("/api/chat/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: this.sessionId }),
      }).catch(() => {});
    }
    this.setStreaming(false);
    this.finalizeResponse();
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
    const backend = this.backendSelect.value || undefined;
    this.addMessage("user", text);
    this.startAssistantMessage();
    this.setStreaming(true);

    const msg = { prompt: text, model, backend };
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
        this.setStreaming(false);
        this.finalizeResponse();
        break;
      case "error":
        this.setStreaming(false);
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
    // Only auto-scroll if user is near the bottom
    const threshold = 100;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    if (isNearBottom) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  async loadSessions() {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const data = await res.json();
      this.allSessions = data.sessions || [];
      this.filterSessions();
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

      const info = document.createElement("span");
      info.className = "session-info";
      info.innerHTML = `<span class="session-id">${s.id}</span><span class="session-count">${s.message_count} msgs</span>`;
      info.addEventListener("click", () => this.loadSession(s.id));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "session-delete";
      deleteBtn.textContent = "\u00D7";
      deleteBtn.title = "Delete session";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteSession(s.id);
      });

      li.appendChild(info);
      li.appendChild(deleteBtn);
      this.sessionListEl.appendChild(li);
    }
  }

  async deleteSession(id) {
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (this.sessionId === id) {
          this.sessionId = null;
          this.messagesEl.innerHTML = "";
        }
        this.loadSessions();
      }
    } catch {
      // ignore fetch errors
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
