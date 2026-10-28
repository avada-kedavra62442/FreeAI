const htmlEscape = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function json(res, status, body) { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); }
export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = (process.env.FREEAI_ALLOWED_ORIGINS || "").split(",").map(s=>s.trim()).filter(Boolean);
  const host = req.headers.host ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}` : "";
  if (origin && !(allowed.length ? allowed.includes(origin) : origin === host)) return json(res,403,{error:"Origin not allowed."});
  if (req.method !== "GET") return json(res,405,{error:"Use GET."});
  const query = String(req.query?.q || "").trim().slice(0,240);
  if (!query) return json(res,400,{error:"Enter a search query."});
  try {
    const url = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query);
    const response = await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; FreeAI/1.0)","Accept":"text/html"},signal:AbortSignal.timeout(9000)});
    if (!response.ok) return json(res,502,{error:"Search provider returned an error."});
    const html = await response.text();
    const results = [];
    const pattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = pattern.exec(html)) && results.length < 6) {
      let link = htmlEscape(match[1]);
      try { const u = new URL(link, "https://duckduckgo.com"); const redirected = u.searchParams.get("uddg"); if (redirected) link = decodeURIComponent(redirected); } catch {}
      if (!/^https?:\/\//i.test(link)) continue;
      const title = htmlEscape(match[2].replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim());
      const snippet = htmlEscape(match[3].replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim());
      if (title && !results.some(r=>r.url===link)) results.push({title,url:link,snippet});
    }
    return json(res,200,{query,results,source:"DuckDuckGo"});
  } catch { return json(res,502,{error:"Web search is temporarily unavailable. Try again shortly."}); }
}
