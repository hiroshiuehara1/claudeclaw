class ChatApp {
  constructor() {
    this.messagesEl = document.getElementById("messages");
    this.form = document.getElementById("chat-form");
    this.input = document.getElementById("chat-input");
    this.sendBtn = document.getElementById("send-btn");
    this.newSessionBtn = document.getElementById("new-session");
    this.currentResponseEl = null;
    this.ws = null;

    this.connect();
    this.bindEvents();
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
      // Reconnect after 2s
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

    this.newSessionBtn.addEventListener("click", () => {
      this.messagesEl.innerHTML = "";
      // Reconnect to get a new session
      this.ws.close();
    });
  }

  send() {
    const text = this.input.value.trim();
    if (!text || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const model = document.getElementById("model-input").value || undefined;
    this.addMessage("user", text);
    this.startAssistantMessage();

    this.ws.send(JSON.stringify({ prompt: text, model }));
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
    el.textContent = text;
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
  }

  startAssistantMessage() {
    const el = document.createElement("div");
    el.className = "message assistant streaming";
    this.messagesEl.appendChild(el);
    this.currentResponseEl = el;
    this.scrollToBottom();
  }

  appendToCurrentResponse(text) {
    if (this.currentResponseEl) {
      this.currentResponseEl.textContent += text;
      this.scrollToBottom();
    }
  }

  finalizeResponse() {
    if (this.currentResponseEl) {
      this.currentResponseEl.classList.remove("streaming");
      this.currentResponseEl = null;
    }
  }

  scrollToBottom() {
    const container = document.getElementById("chat-container");
    container.scrollTop = container.scrollHeight;
  }
}

new ChatApp();
