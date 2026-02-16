const STORAGE_KEY = "obsnote_access_token";

const state = {
  accessToken: null,
  user: null,
  folders: [],
  notes: [],
  selectedFolderId: null,
  selectedNote: null,
  searchQuery: "",
  saveTimer: null,
  activityFilters: {},
  refreshPromise: null
};

const els = {
  views: {
    login: document.getElementById("view-login"),
    forceReset: document.getElementById("view-force-reset"),
    app: document.getElementById("view-app"),
    admin: document.getElementById("view-admin")
  },
  userBadge: document.getElementById("user-badge"),
  navApp: document.getElementById("nav-app"),
  navAdmin: document.getElementById("nav-admin"),
  logoutBtn: document.getElementById("logout-btn"),
  toast: document.getElementById("toast"),

  loginForm: document.getElementById("login-form"),
  forceResetForm: document.getElementById("force-reset-form"),

  folderList: document.getElementById("folder-list"),
  noteList: document.getElementById("note-list"),
  createFolderBtn: document.getElementById("create-folder-btn"),
  createNoteBtn: document.getElementById("create-note-btn"),
  deleteNoteBtn: document.getElementById("delete-note-btn"),
  noteTitle: document.getElementById("note-title"),
  noteContent: document.getElementById("note-content"),
  saveStatus: document.getElementById("save-status"),
  searchInput: document.getElementById("search-input"),
  versionList: document.getElementById("version-list"),

  createUserForm: document.getElementById("create-user-form"),
  tempPassword: document.getElementById("temp-password"),
  refreshUsersBtn: document.getElementById("refresh-users-btn"),
  usersTableBody: document.querySelector("#users-table tbody"),

  activityFilterForm: document.getElementById("activity-filter-form"),
  refreshActivityBtn: document.getElementById("refresh-activity-btn"),
  activitySummary: document.getElementById("activity-summary"),
  activityTableBody: document.querySelector("#activity-table tbody")
};

const hiddenClass = "hidden";

const showToast = (message, isError = false) => {
  if (!message) {
    return;
  }

  els.toast.textContent = message;
  els.toast.style.background = isError ? "rgba(110, 28, 28, 0.95)" : "rgba(20, 37, 23, 0.95)";
  els.toast.classList.remove(hiddenClass);
  setTimeout(() => els.toast.classList.add(hiddenClass), 3200);
};

const showView = (viewName) => {
  Object.entries(els.views).forEach(([name, element]) => {
    if (!element) {
      return;
    }
    element.classList.toggle(hiddenClass, name !== viewName);
  });
};

const setTopbarState = () => {
  const isLoggedIn = Boolean(state.user);
  els.userBadge.classList.toggle(hiddenClass, !isLoggedIn);
  els.logoutBtn.classList.toggle(hiddenClass, !isLoggedIn);
  els.navApp.classList.toggle(hiddenClass, !isLoggedIn);
  els.navAdmin.classList.toggle(hiddenClass, !isLoggedIn || state.user?.role !== "admin");

  if (!isLoggedIn) {
    els.userBadge.textContent = "";
    return;
  }

  els.userBadge.textContent = `${state.user.email} (${state.user.role})`;
};

const setSession = ({ accessToken, user }) => {
  state.accessToken = accessToken;
  state.user = user;
  localStorage.setItem(STORAGE_KEY, accessToken);
  setTopbarState();
};

const clearSession = () => {
  state.accessToken = null;
  state.user = null;
  localStorage.removeItem(STORAGE_KEY);
  setTopbarState();
};

const isJsonResponse = (response) => {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
};

const tryRefresh = async () => {
  if (state.refreshPromise) {
    return state.refreshPromise;
  }

  state.refreshPromise = (async () => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      clearSession();
      return false;
    }

    const payload = isJsonResponse(response) ? await response.json() : null;
    if (!payload?.accessToken || !payload?.user) {
      clearSession();
      return false;
    }

    setSession(payload);
    return true;
  })();

  try {
    return await state.refreshPromise;
  } finally {
    state.refreshPromise = null;
  }
};

const apiRequest = async (path, { method = "GET", body, headers = {} } = {}, canRetry = true) => {
  const finalHeaders = {
    ...headers
  };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (state.accessToken) {
    finalHeaders.Authorization = `Bearer ${state.accessToken}`;
  }

  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const payload = isJsonResponse(response) ? await response.json() : null;

  if (response.status === 401 && canRetry && !path.includes("/api/auth/login")) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiRequest(path, { method, body, headers }, false);
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = payload?.error;
    error.payload = payload;

    if (error.code === "PASSWORD_RESET_REQUIRED") {
      showView("forceReset");
    }

    throw error;
  }

  return payload;
};

const setSaveStatus = (value, isError = false) => {
  els.saveStatus.textContent = value;
  els.saveStatus.style.color = isError ? "#8b2f2f" : "";
};

const fmtTime = (isoValue) => {
  if (!isoValue) {
    return "-";
  }
  const date = new Date(isoValue);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const bootstrapAfterAuth = async () => {
  if (!state.user) {
    showView("login");
    return;
  }

  if (state.user.mustChangePassword) {
    showView("forceReset");
    return;
  }

  await loadWorkspace();
  if (state.user.role === "admin") {
    await Promise.all([loadAdminUsers(), loadAdminActivity()]);
    showView("admin");
  } else {
    showView("app");
  }
};

const loadWorkspace = async () => {
  await loadFolders();
  await loadNotes();
  setEditorState(null);
};

const setEditorState = (note) => {
  state.selectedNote = note;

  const isEnabled = Boolean(note);
  els.noteTitle.disabled = !isEnabled;
  els.noteContent.disabled = !isEnabled;
  els.deleteNoteBtn.disabled = !isEnabled;

  els.noteTitle.value = note?.title ?? "";
  els.noteContent.value = note?.contentMarkdown ?? "";

  if (note) {
    setSaveStatus(`Last updated ${fmtTime(note.updatedAt)}`);
    loadVersions(note._id).catch((error) => {
      showToast(error.message, true);
    });
  } else {
    setSaveStatus("No note selected");
    renderVersionList([]);
  }
};

const renderFolderList = () => {
  els.folderList.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = `folder-item${state.selectedFolderId ? "" : " active"}`;
  allButton.textContent = "All Notes";
  allButton.addEventListener("click", async () => {
    state.selectedFolderId = null;
    state.searchQuery = "";
    els.searchInput.value = "";
    renderFolderList();
    await loadNotes();
  });
  const allLi = document.createElement("li");
  allLi.appendChild(allButton);
  els.folderList.appendChild(allLi);

  state.folders.forEach((folder) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `folder-item${state.selectedFolderId === folder._id ? " active" : ""}`;
    const depth = (folder.pathCache.match(/\//g) ?? []).length;
    button.style.paddingLeft = `${10 + depth * 16}px`;
    button.innerHTML = `<strong>${folder.name}</strong><small>${folder.pathCache || folder.name}</small>`;
    button.addEventListener("click", async () => {
      state.selectedFolderId = folder._id;
      state.searchQuery = "";
      els.searchInput.value = "";
      renderFolderList();
      await loadNotes();
    });
    li.appendChild(button);
    els.folderList.appendChild(li);
  });
};

const renderNoteList = () => {
  els.noteList.innerHTML = "";

  if (state.notes.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No notes yet.";
    els.noteList.appendChild(li);
    return;
  }

  state.notes.forEach((note) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `note-item${state.selectedNote?._id === note._id ? " active" : ""}`;
    button.innerHTML = `<strong>${note.title}</strong><small>${fmtTime(note.updatedAt)}</small>`;
    button.addEventListener("click", async () => {
      await openNote(note._id);
    });
    li.appendChild(button);
    els.noteList.appendChild(li);
  });
};

const renderVersionList = (versions) => {
  els.versionList.innerHTML = "";
  if (!versions.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No previous versions.";
    els.versionList.appendChild(li);
    return;
  }

  versions.forEach((version) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "version-item";
    button.innerHTML = `<span>${fmtTime(version.createdAt)}</span><span>Restore</span>`;
    button.addEventListener("click", async () => {
      if (!state.selectedNote) {
        return;
      }
      if (!window.confirm("Restore this version? Current note state will be snapshotted.")) {
        return;
      }
      try {
        const payload = await apiRequest(
          `/api/notes/${state.selectedNote._id}/restore/${version._id}`,
          { method: "POST" }
        );
        replaceNoteInState(payload.note);
        setEditorState(payload.note);
        renderNoteList();
        showToast("Version restored");
      } catch (error) {
        showToast(error.message, true);
      }
    });
    li.appendChild(button);
    els.versionList.appendChild(li);
  });
};

const replaceNoteInState = (note) => {
  const index = state.notes.findIndex((item) => item._id === note._id);
  if (index === -1) {
    state.notes.unshift(note);
    return;
  }
  state.notes[index] = note;
  state.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

const loadFolders = async () => {
  const payload = await apiRequest("/api/folders");
  state.folders = payload.folders ?? [];
  renderFolderList();
};

const loadNotes = async () => {
  const query = state.selectedFolderId ? `?folderId=${encodeURIComponent(state.selectedFolderId)}` : "";
  const payload = await apiRequest(`/api/notes${query}`);
  state.notes = payload.notes ?? [];
  renderNoteList();
};

const openNote = async (noteId) => {
  const payload = await apiRequest(`/api/notes/${noteId}`);
  setEditorState(payload.note);
  renderNoteList();
};

const saveCurrentNote = async () => {
  if (!state.selectedNote) {
    return;
  }
  const title = els.noteTitle.value.trim();
  if (!title) {
    setSaveStatus("Title is required", true);
    return;
  }

  setSaveStatus("Saving...");
  try {
    const payload = await apiRequest(`/api/notes/${state.selectedNote._id}`, {
      method: "PATCH",
      body: {
        title,
        contentMarkdown: els.noteContent.value,
        folderId: state.selectedNote.folderId
      }
    });
    replaceNoteInState(payload.note);
    setEditorState(payload.note);
    renderNoteList();
    setSaveStatus(`Saved ${fmtTime(payload.note.updatedAt)}`);
  } catch (error) {
    setSaveStatus(error.message, true);
  }
};

const scheduleAutosave = () => {
  if (!state.selectedNote) {
    return;
  }

  clearTimeout(state.saveTimer);
  setSaveStatus("Unsaved changes");
  state.saveTimer = setTimeout(() => {
    saveCurrentNote().catch((error) => {
      showToast(error.message, true);
    });
  }, 2100);
};

const loadVersions = async (noteId) => {
  const payload = await apiRequest(`/api/notes/${noteId}/versions`);
  renderVersionList(payload.versions ?? []);
};

const searchNotes = async (value) => {
  const q = value.trim();
  state.searchQuery = q;
  if (!q) {
    await loadNotes();
    return;
  }

  const payload = await apiRequest(`/api/search?q=${encodeURIComponent(q)}`);
  state.notes = payload.notes ?? [];
  renderNoteList();
};

const renderUsers = (users) => {
  els.usersTableBody.innerHTML = "";

  users.forEach((user) => {
    const tr = document.createElement("tr");
    const actionLabel = user.status === "active" ? "Disable" : "Enable";
    const nextStatus = user.status === "active" ? "disabled" : "active";

    tr.innerHTML = `
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${user.status}</td>
      <td>${fmtTime(user.lastLoginAt)}</td>
      <td>${user.activityCount ?? 0}</td>
      <td><button type="button" class="small-btn">${actionLabel}</button></td>
    `;

    const button = tr.querySelector("button");
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/api/admin/users/${user._id}/status`, {
          method: "PATCH",
          body: { status: nextStatus }
        });
        await loadAdminUsers();
      } catch (error) {
        showToast(error.message, true);
      }
    });

    els.usersTableBody.appendChild(tr);
  });
};

const loadAdminUsers = async () => {
  if (state.user?.role !== "admin") {
    return;
  }
  const payload = await apiRequest("/api/admin/users");
  renderUsers(payload.users ?? []);
};

const renderActivitySummary = (summary) => {
  els.activitySummary.innerHTML = "";
  const metrics = summary.metrics ?? {};
  const cards = [
    { label: "Logins", value: metrics.loginSuccess ?? 0 },
    { label: "Failed logins", value: metrics.loginFailed ?? 0 },
    { label: "Notes created", value: metrics.notesCreated ?? 0 },
    { label: "Notes updated", value: metrics.notesUpdated ?? 0 },
    { label: "Notes deleted", value: metrics.notesDeleted ?? 0 }
  ];

  cards.forEach((card) => {
    const div = document.createElement("div");
    div.className = "summary-card";
    div.innerHTML = `<h4>${card.label}</h4><strong>${card.value}</strong>`;
    els.activitySummary.appendChild(div);
  });
};

const renderActivityRows = (events) => {
  els.activityTableBody.innerHTML = "";

  if (!events.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="muted">No events.</td>`;
    els.activityTableBody.appendChild(tr);
    return;
  }

  events.forEach((event) => {
    const actor = event.actorUserId?.email ?? "N/A";
    const target = [event.targetType, event.targetId].filter(Boolean).join(":") || "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmtTime(event.createdAt)}</td>
      <td>${event.eventType}</td>
      <td>${actor}</td>
      <td>${event.ipAddress ?? "-"}</td>
      <td>${target}</td>
    `;
    els.activityTableBody.appendChild(tr);
  });
};

const buildActivityQuery = () => {
  const params = new URLSearchParams();
  params.set("limit", "75");

  Object.entries(state.activityFilters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

const loadAdminActivity = async () => {
  if (state.user?.role !== "admin") {
    return;
  }

  const query = buildActivityQuery();
  const [activityPayload, summaryPayload] = await Promise.all([
    apiRequest(`/api/admin/activity${query}`),
    apiRequest(`/api/admin/activity/summary${query}`)
  ]);
  renderActivityRows(activityPayload.events ?? []);
  renderActivitySummary(summaryPayload);
};

const handleLoginSubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  try {
    const payload = await apiRequest("/api/auth/login", {
      method: "POST",
      body: {
        email: form.get("email"),
        password: form.get("password")
      }
    });
    setSession(payload);
    await bootstrapAfterAuth();
    showToast("Logged in");
  } catch (error) {
    showToast(error.message, true);
  }
};

const handleForceReset = async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const payload = await apiRequest("/api/auth/force-reset-password", {
      method: "POST",
      body: {
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword")
      }
    });
    state.user = payload.user;
    setTopbarState();
    await bootstrapAfterAuth();
    showToast("Password updated");
  } catch (error) {
    showToast(error.message, true);
  }
};

const handleCreateFolder = async () => {
  const name = window.prompt("Folder name");
  if (!name) {
    return;
  }
  try {
    await apiRequest("/api/folders", {
      method: "POST",
      body: {
        name: name.trim(),
        parentFolderId: state.selectedFolderId
      }
    });
    await loadFolders();
    showToast("Folder created");
  } catch (error) {
    showToast(error.message, true);
  }
};

const handleCreateNote = async () => {
  const title = window.prompt("Note title");
  if (!title) {
    return;
  }

  try {
    const payload = await apiRequest("/api/notes", {
      method: "POST",
      body: {
        title: title.trim(),
        folderId: state.selectedFolderId,
        contentMarkdown: ""
      }
    });
    await loadNotes();
    await openNote(payload.note._id);
    showToast("Note created");
  } catch (error) {
    showToast(error.message, true);
  }
};

const handleDeleteNote = async () => {
  if (!state.selectedNote) {
    return;
  }
  if (!window.confirm("Delete this note?")) {
    return;
  }

  try {
    await apiRequest(`/api/notes/${state.selectedNote._id}`, { method: "DELETE" });
    setEditorState(null);
    await loadNotes();
    showToast("Note deleted");
  } catch (error) {
    showToast(error.message, true);
  }
};

const handleCreateUser = async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  try {
    const payload = await apiRequest("/api/admin/users", {
      method: "POST",
      body: {
        email: form.get("email"),
        role: form.get("role")
      }
    });
    els.tempPassword.textContent = `Temporary password for ${payload.user.email}: ${payload.temporaryPassword}`;
    await loadAdminUsers();
    showToast("User created");
  } catch (error) {
    showToast(error.message, true);
  }
};

const handleActivityFilters = async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.activityFilters = {
    eventType: String(form.get("eventType") || "").trim(),
    userId: String(form.get("userId") || "").trim(),
    from: String(form.get("from") || "").trim(),
    to: String(form.get("to") || "").trim()
  };
  try {
    await loadAdminActivity();
    showToast("Activity filters applied");
  } catch (error) {
    showToast(error.message, true);
  }
};

const handleLogout = async () => {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" }, false);
  } catch (error) {
    // Ignore logout errors and always clear local state.
  }

  clearSession();
  state.folders = [];
  state.notes = [];
  state.selectedNote = null;
  state.selectedFolderId = null;
  renderFolderList();
  renderNoteList();
  renderVersionList([]);
  showView("login");
  showToast("Logged out");
};

const attachListeners = () => {
  els.loginForm.addEventListener("submit", handleLoginSubmit);
  els.forceResetForm.addEventListener("submit", handleForceReset);
  els.logoutBtn.addEventListener("click", handleLogout);

  els.navApp.addEventListener("click", () => showView("app"));
  els.navAdmin.addEventListener("click", () => {
    if (state.user?.role === "admin") {
      showView("admin");
    }
  });

  els.createFolderBtn.addEventListener("click", handleCreateFolder);
  els.createNoteBtn.addEventListener("click", handleCreateNote);
  els.deleteNoteBtn.addEventListener("click", handleDeleteNote);

  els.noteTitle.addEventListener("input", scheduleAutosave);
  els.noteContent.addEventListener("input", scheduleAutosave);

  let searchDebounce = null;
  els.searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchNotes(els.searchInput.value).catch((error) => showToast(error.message, true));
    }, 280);
  });

  els.createUserForm.addEventListener("submit", handleCreateUser);
  els.refreshUsersBtn.addEventListener("click", () => {
    loadAdminUsers().catch((error) => showToast(error.message, true));
  });
  els.activityFilterForm.addEventListener("submit", handleActivityFilters);
  els.refreshActivityBtn.addEventListener("click", () => {
    loadAdminActivity().catch((error) => showToast(error.message, true));
  });
};

const hydrateSession = async () => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) {
    state.accessToken = token;
    try {
      const payload = await apiRequest("/api/me", {}, false);
      state.user = payload.user;
      setTopbarState();
      return;
    } catch (error) {
      clearSession();
    }
  }

  await tryRefresh();
};

const init = async () => {
  attachListeners();
  setTopbarState();

  try {
    await hydrateSession();
    await bootstrapAfterAuth();
  } catch (error) {
    clearSession();
    showView("login");
  }
};

init();

