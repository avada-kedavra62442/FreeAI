const DEFAULT_MODEL = "openrouter/free";
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 12000;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function configureCors(req, res) {
  const origin = req.headers.origin;
  const configured = (process.env.FREEAI_ALLOWED_ORIGINS || "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const requestHost = req.headers.host ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}` : "";
  const allowed = configured.length ? configured.includes(origin) : (!origin || origin === requestHost);

  if (origin && allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  return allowed;
}

export default async function handler(req, res) {
  const originAllowed = configureCors(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (!originAllowed) return sendJson(res, 403, { error: "This origin is not allowed to use the FreeAI API." });
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, { error: "Use POST to send a message." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return sendJson(res, 503, {
    error: "FreeAI's model provider is not configured yet. Add OPENROUTER_API_KEY in Vercel Project Settings → Environment Variables."
  });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return sendJson(res, 400, { error: "The request body must be valid JSON." });
  }

  if (!body || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) {
    return sendJson(res, 400, { error: `Send between 1 and ${MAX_MESSAGES} messages.` });
  }

  const messages = [];
  for (const message of body.messages) {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") {
      return sendJson(res, 400, { error: "Each message must have a user/assistant role and text content." });
    }
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) {
      return sendJson(res, 400, { error: `Each message must contain 1–${MAX_MESSAGE_CHARS} characters.` });
    }
    messages.push({ role: message.role, content });
  }
  if (messages[messages.length - 1].role !== "user") {
    return sendJson(res, 400, { error: "The last message must be from you." });
  }

  const model = process.env.FREEAI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  res.on("close", () => { if (!res.writableEnded) controller.abort(); });

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FREEAI_SITE_URL || "https://freeai.vercel.app",
        "X-Title": "FreeAI"
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: 1800,
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content: "You are FreeAI, a helpful, thoughtful, honest AI assistant. Give clear, useful answers; reason carefully; help with learning, writing, coding, planning, and problem solving. Never claim you performed an external action, visited a site, ran code, or changed a file unless a real tool did so. If a task needs tools you do not have, say so and offer the best next step. Be transparent about uncertainty and current information. Use Markdown when it improves readability."
          },
          ...messages
        ]
      })
    });

    if (!upstream.ok) {
      let providerMessage = "";
      try {
        const payload = await upstream.json();
        providerMessage = payload?.error?.message || payload?.message || "";
      } catch {}
      if (upstream.status === 429) return sendJson(res, 429, { error: "The free model is busy or its usage limit has been reached. Please wait and try again." });
      if (upstream.status === 401 || upstream.status === 403) return sendJson(res, 502, { error: "The model provider rejected its API key. Check OPENROUTER_API_KEY in Vercel." });
      return sendJson(res, 502, { error: `The model provider returned an error (${upstream.status}). ${providerMessage.slice(0, 220)}`.trim() });
    }

    if (!upstream.body) return sendJson(res, 502, { error: "The model provider returned an empty stream." });
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (res.destroyed) {
          await reader.cancel();
          break;
        }
        if (value) res.write(Buffer.from(value));
      }
      if (!res.destroyed) res.end();
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (!res.headersSent) {
      if (error?.name === "AbortError") return sendJson(res, 504, { error: "The model took too long to respond. Please try again." });
      return sendJson(res, 502, { error: "FreeAI could not reach the model provider. Check the provider status and try again." });
    }
    if (!res.destroyed) res.end();
  } finally {
    clearTimeout(timeout);
  }
}