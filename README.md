# FreeAI

FreeAI is a free-first assistant with an Emerald/Silver dark UI, guest mode, optional Supabase authentication/cloud sync, web search tools, file and image input, and model tool-calling.

## Provider and zero-cost reality
The default model is `openrouter/free`. OpenRouter free model availability, capabilities, and request quotas can change. This does not provide GPT-6 and does not guarantee that every free model supports image input or tool calls. GPT-6 API access is not currently available on a free API tier. Keep paid credits disabled if you require a $0 provider bill.

## Deploy
1. Import the repository into Vercel as a Vite project.
2. Set `OPENROUTER_API_KEY` and `FREEAI_MODEL=openrouter/free` in Vercel environment variables. Keep the provider key server-only.
3. Set `FREEAI_ALLOWED_ORIGINS` to the exact deployed origin (for example `https://your-project.vercel.app`). Set `FREEAI_SITE_URL` to that URL if desired.
4. Deploy. Redeploy after changing environment variables.

## Web search and tools
The assistant can call a DuckDuckGo HTML search adapter and a restricted arithmetic calculator through the server-side tool loop. Search is best-effort and can fail if the upstream site changes or rate-limits requests. It is not a full browser and cannot sign in to websites or take external actions.

## Files and images
The client extracts text from common text/code formats and PDFs using PDF.js; images are passed as image input to the selected model. Image understanding requires a free model that supports vision and the provider may reject unsupported content. Files are processed in the browser and are not stored by FreeAI on a server, but selected file contents/images are sent to the configured model provider when you submit a prompt. Do not upload sensitive files unless comfortable with that provider's privacy terms. Limits are enforced client-side.

## Optional Supabase login and cloud sync
1. Create a Supabase project on its free plan.
2. In Supabase Project Settings → API, copy the Project URL and anon/public key.
3. In Vercel Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These are browser-visible project settings, not secrets; never use the service-role key.
4. Run `supabase/schema.sql` in Supabase SQL Editor to create the chat table and row-level security policies.
5. Redeploy. Email/password sign-in and cloud sync become available. Configure email confirmation / SMTP in Supabase as desired. Without these variables, FreeAI remains in guest mode.
6. Supabase Free plan limits and policies can change; no paid services are required by this code.

## Implemented scope and limitations
- Guest chat history in local storage; optional account and cloud sync.
- Streaming responses from the model provider (server endpoint returns the completed assistant message; browser displays it after the response).
- Server-side model tool loop with web search and arithmetic.
- Text/code and PDF text extraction; image input for vision-capable models.
- Basic request size validation, origin allow-list, timeout, and readable errors.
- This is not full ChatGPT/Gemini/Claude parity: no arbitrary code execution, general-purpose computer use, autonomous external actions, or guaranteed free image/tool-capable model. Free provider rate limits apply.


## Install as an app (PWA)
FreeAI includes a web app manifest, service worker, SVG favicon sizes, scalable install icons, and a 180px Apple touch icon. On Android, Chrome/Edge, Windows, and Linux, use the browser's Install app option or the Install app button when offered. On iPhone/iPad, open the site in Safari, tap Share, then choose Add to Home Screen. iOS/iPadOS use the manual Share-sheet flow rather than the same install prompt as Chromium browsers. The service worker caches the app shell only; API calls are never cached. First visit and AI features require internet access.

## Web search troubleshooting
The chat endpoint attempts Bing RSS first, DuckDuckGo HTML second, and Wikipedia OpenSearch as a final fallback. The Web Search toggle triggers server-side search directly rather than relying only on a model tool call. Free upstream providers can still rate-limit or change their output. The assistant instructions, response budget, Markdown source links, and fallback for free models without tool-call support have also been improved.
