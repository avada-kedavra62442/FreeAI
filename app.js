const STORAGE_KEY = "freeai.guest.chats.v1";
const $ = (id) => document.getElementById(id);
const form = $("chatForm");
const input = $("promptInput");
const messagesEl = $("messages");
const welcome = $("welcome");
const historyList = $("historyList");
const sendButton = $("sendButton");
const conversation = $("conversation");

let chats = loadChats();
let activeId = chats[0]?.id || null;
let streaming = false;
let abortController = null;

function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
function loadChats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(c => c && c.id && Array.isArray(c.messages)) : [];
  } catch { return []; }
}
function saveChats() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 40))); }
  catch { showToast("Browser storage is full. Export or clear older chats."); }
}
function activeChat() { return chats.find(c => c.id === activeId); }
function createChat() {
  const chat = { id: uid(), title: "New chat", messages: [], updatedAt: Date.now() };
  chats.unshift(chat); activeId = chat.id; saveChats(); renderAll(); input.focus();
}
function titleFrom(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 34 ? cleaned.slice(0, 34) + "…" : cleaned || "New chat";
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
}
function renderMarkdown(text) {
  let safe = escapeHtml(text);
  const code = [];
  safe = safe.replace(/```([\w-]*)\n?([\s\S]*?)```/g, (_, lang, body) => {
    const index = code.push({ lang, body }) - 1;
    return `@@CODE${index}@@`;
  });
  safe = safe.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  safe = safe.replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>");
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  safe = safe.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
  safe = safe.replace(/^(?:- |\* )(.*)$/gm, "<li>$1</li>");
  safe = safe.replace(/(?:<li>.*?<\/li>\n?)+/gs, match => `<ul>${match}</ul>`);
  safe = safe.replace(/^(\d+)\. (.*)$/gm, "<li>$2</li>");
  safe = safe.split(/\n{2,}/).map(block => {
    if (/^@@CODE\d+@@$/.test(block) || /^<(h[1-3]|ul|blockquote)/.test(block)) return block;
    return block.replace(/\n/g, "<br>");
  }).join("\n");
  safe = safe.replace(/@@CODE(\d+)@@/g, (_, n) => {
    const item = code[Number(n)];
    return `<div class="code-block"><div class="code-header"><span>${escapeHtml(item.lang || "code")}</span><button class="copy-code" type="button">Copy</button></div><pre><code>${item.body}</code></pre></div>`;
  });
  return safe;
}
function renderHistory() {
  historyList.innerHTML = "";
  [...chats].sort((a,b) => b.updatedAt - a.updatedAt).forEach(chat => {
    const button = document.createElement("button");
    button.className = "history-item" + (chat.id === activeId ? " active" : "");
    button.type = "button";
    button.innerHTML = `<span class="history-title">${escapeHtml(chat.title)}</span><span class="delete-chat" role="button" tabindex="0" aria-label="Delete chat">×</span>`;
    button.addEventListener("click", event => {
      if (event.target.closest(".delete-chat")) {
        event.stopPropagation(); deleteChat(chat.id); return;
      }
      if (streaming) return;
      activeId = chat.id; renderAll(); closeSidebar();
    });
    button.querySelector(".delete-chat").addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); deleteChat(chat.id); }
    });
    historyList.append(button);
  });
}
function renderMessages() {
  const chat = activeChat();
  const messages = chat?.messages || [];
  welcome.hidden = messages.length > 0;
  messagesEl.innerHTML = "";
  messages.forEach((message, index) => {
    const row = document.createElement("article");
    row.className = "message-row " + (message.role === "user" ? "user-row" : "assistant-row");
    const avatar = message.role === "user" ? "Y" : "F";
    row.innerHTML = `<div class="message-avatar ${message.role}">${avatar}</div><div class="message-content"><div class="message-author">${message.role === "user" ? "You" : "FreeAI"}</div><div class="message-body">${message.content ? renderMarkdown(message.content) : '<span class="typing-dots"><i></i><i></i><i></i></span>'}</div>${message.role === "assistant" && message.content ? '<div class="message-tools"><button class="copy-message" type="button">Copy response</button></div>' : ""}</div>`;
    row.querySelector(".copy-message")?.addEventListener("click", () => copyText(message.content));
    row.querySelectorAll(".copy-code").forEach(button => button.addEventListener("click", () => copyText(button.closest(".code-block").querySelector("pre").innerText)));
    messagesEl.append(row);
  });
  requestAnimationFrame(() => { conversation.scrollTop = conversation.scrollHeight; });
}
function renderAll() { renderHistory(); renderMessages(); }
function deleteChat(id) {
  if (streaming && id === activeId) stopGeneration();
  chats = chats.filter(chat => chat.id !== id);
  if (activeId === id) activeId = chats[0]?.id || null;
  saveChats(); renderAll();
}
function closeSidebar() { $("sidebar").classList.remove("open"); $("sidebarScrim").classList.remove("visible"); }
function openSidebar() { $("sidebar").classList.add("open"); $("sidebarScrim").classList.add("visible"); }
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) { toast = document.createElement("div"); toast.className = "toast"; document.body.append(toast); }
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); showToast("Copied to clipboard"); }
  catch { showToast("Clipboard access was blocked by your browser."); }
}
function resizeInput() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 180) + "px"; }
function setBusy(value) {
  streaming = value;
  sendButton.innerHTML = value ? '<span class="stop-square"></span>' : "<span>↑</span>";
  sendButton.setAttribute("aria-label", value ? "Stop generating" : "Send message");
  input.disabled = false;
  document.body.classList.toggle("is-streaming", value);
}
async function sendMessage(text) {
  const content = text.trim();
  if (!content || streaming) return;
  if (!activeChat()) createChat();
  const chat = activeChat();
  if (!chat.messages.length) chat.title = titleFrom(content);
  chat.messages.push({ role: "user", content });
  chat.updatedAt = Date.now();
  const history = chat.messages.slice(0, -1).slice(-22);
  saveChats(); renderAll(); input.value = ""; resizeInput();
  chat.messages.push({ role: "assistant", content: "" });
  setBusy(true); renderAll();
  abortController = new AbortController();
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortController.signal,
      body: JSON.stringify({ messages: [...history, { role: "user", content }] })
    });
    if (!response.ok) {
      let error = "FreeAI couldn't get a response.";
      try { error = (await response.json()).error || error; } catch {}
      throw new Error(error);
    }
    if (!response.body) throw new Error("Your browser does not support streamed responses.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          if (event.error) throw new Error(event.error.message || "Model stream error");
          answer += event.choices?.[0]?.delta?.content || "";
        } catch (error) {
          if (error instanceof SyntaxError) continue;
          throw error;
        }
        chat.messages[chat.messages.length - 1].content = answer;
        renderMessages();
      }
    }
    if (!answer.trim()) chat.messages[chat.messages.length - 1].content = "The selected free model returned an empty response. Try again or wait for model availability to recover.";
  } catch (error) {
    const assistant = chat.messages[chat.messages.length - 1];
    assistant.content = error.name === "AbortError"
      ? (assistant.content ? assistant.content + "\n\n*Generation stopped.*" : "Generation stopped.")
      : `**I couldn't complete that request.**\n\n${error.message || "Please try again."}`;
  } finally {
    chat.updatedAt = Date.now(); saveChats(); setBusy(false); abortController = null; renderAll(); input.focus();
  }
}
function stopGeneration() { abortController?.abort(); }

form.addEventListener("submit", event => {
  event.preventDefault();
  if (streaming) { stopGeneration(); return; }
  sendMessage(input.value);
});
input.addEventListener("input", resizeInput);
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault(); form.requestSubmit();
  }
});
$("newChat").addEventListener("click", () => { if (!streaming) createChat(); closeSidebar(); });
$("clearHistory").addEventListener("click", () => {
  if (streaming) stopGeneration();
  if (chats.length && confirm("Clear all FreeAI chats stored on this device? This cannot be undone.")) {
    chats = []; activeId = null; saveChats(); renderAll();
  }
});
$("openSidebar").addEventListener("click", openSidebar);
$("closeSidebar").addEventListener("click", closeSidebar);
$("sidebarScrim").addEventListener("click", closeSidebar);
document.querySelectorAll("[data-prompt]").forEach(button => button.addEventListener("click", () => {
  input.value = button.dataset.prompt || ""; resizeInput(); input.focus();
}));
window.addEventListener("beforeunload", () => { if (streaming) abortController?.abort(); });
renderAll();
