const chatForm = document.getElementById("chatForm");
const promptInput = document.getElementById("prompt");
const messagesEl = document.getElementById("messages");
const backendEl = document.getElementById("backend");
const strictModeEl = document.getElementById("strictMode");
const sessionListEl = document.getElementById("sessionList");
const newSessionBtn = document.getElementById("newSession");

let currentSessionId = null;
let activeAssistantNode = null;
let ws = null;

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function makeMessage(role, text, meta = "") {
  const node = document.createElement("div");
  node.className = `message ${role}`;

  if (meta) {
    const label = document.createElement("small");
    label.textContent = meta;
    node.appendChild(label);
  }

  const body = document.createElement("div");
  body.textContent = text;
  node.appendChild(body);

  messagesEl.appendChild(node);
  scrollToBottom();
  return node;
}

function setSession(id) {
  currentSessionId = id;
  document.querySelectorAll(".sessions button").forEach((button) => {
    button.classList.toggle("active", button.dataset.sessionId === id);
  });
}

async function refreshSessions() {
  const response = await fetch("/api/sessions");
  if (!response.ok) {
    return;
  }

  const sessions = await response.json();
  sessionListEl.innerHTML = "";

  for (const session of sessions) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.sessionId = session.id;
    button.textContent = `${session.id.slice(0, 10)} · ${new Date(session.updatedAt).toLocaleString()}`;
    button.addEventListener("click", () => {
      loadSession(session.id);
    });
    item.appendChild(button);
    sessionListEl.appendChild(item);
  }

  if (currentSessionId) {
    setSession(currentSessionId);
  }
}

async function loadSession(sessionId) {
  const response = await fetch(`/api/sessions/${sessionId}/messages`);
  if (!response.ok) {
    return;
  }

  const messages = await response.json();
  messagesEl.innerHTML = "";

  for (const message of messages) {
    if (message.role === "user") {
      makeMessage("user", message.content);
      continue;
    }
    makeMessage("assistant", message.content, message.backend || "assistant");
  }

  setSession(sessionId);
  scrollToBottom();
}

function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/api/chat/ws`;
  ws = new WebSocket(wsUrl);

  ws.addEventListener("close", () => {
    setTimeout(connectWebSocket, 800);
  });

  ws.addEventListener("message", async (event) => {
    const payload = JSON.parse(event.data);

    if (payload.type === "response.start") {
      if (payload.sessionId) {
        setSession(payload.sessionId);
      }
      activeAssistantNode = makeMessage("assistant", "", payload.backend);
      return;
    }

    if (payload.type === "response.delta") {
      if (!activeAssistantNode) {
        activeAssistantNode = makeMessage("assistant", "", payload.backend);
      }
      const textNode = activeAssistantNode.lastElementChild;
      textNode.textContent += payload.text;
      scrollToBottom();
      return;
    }

    if (payload.type === "response.error") {
      makeMessage("system", `${payload.code}: ${payload.message}`);
      activeAssistantNode = null;
      return;
    }

    if (payload.type === "response.end") {
      activeAssistantNode = null;
      if (payload.sessionId) {
        setSession(payload.sessionId);
      }
      await refreshSessions();
    }
  });
}

async function sendViaHttp(prompt) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      backend: backendEl.value,
      sessionId: currentSessionId,
      strict: strictModeEl.checked
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    makeMessage("system", error.message || "Request failed");
    return;
  }

  const result = await response.json();
  setSession(result.sessionId);
  makeMessage("assistant", result.text, result.backend);
  await refreshSessions();
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) {
    return;
  }

  makeMessage("user", prompt);
  promptInput.value = "";

  const payload = {
    prompt,
    backend: backendEl.value,
    sessionId: currentSessionId,
    strict: strictModeEl.checked
  };

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
    return;
  }

  await sendViaHttp(prompt);
});

newSessionBtn.addEventListener("click", () => {
  currentSessionId = null;
  messagesEl.innerHTML = "";
  makeMessage("system", "Started a new local session");
  setSession(null);
});

connectWebSocket();
refreshSessions();
