# FreeAI

FreeAI is a free-first AI assistant project with an emerald-and-silver dark interface, guest chat history, and a serverless streaming API.

## Important: GPT-6 and free access

FreeAI does **not** claim to provide GPT-6 for free. Official OpenAI API model access is usage-billed; the API free tier is not supported for GPT-6 Astra. This project defaults to `openrouter/free`, which routes to an eligible model with free inference availability. Free model availability, performance, context limits, and provider quotas change over time.

If an official, authorized GPT-6 endpoint becomes available at no cost, the provider adapter can be extended. Do not use unofficial endpoints, leaked credentials, or another person's account to bypass billing.

## Current implementation

- Responsive dark Emerald/Silver interface, including small-screen and landscape layouts.
- Guest conversations stored in this browser's local storage.
- Streaming model responses through a Vercel serverless endpoint.
- API key kept server-side; never expose it through a `VITE_*` variable.
- Basic request validation, origin allow-list, timeout, and readable provider errors.
- No mandatory account, subscription, advertisements, or paid service in the UI.

## Setup

1. Create an OpenRouter account and an API key at [OpenRouter](https://openrouter.ai/). Use only its free models and do not add paid credits if you want to keep your own usage at $0.
2. Import this repository into Vercel as a Vite project.
3. Add these Environment Variables in Vercel Project Settings:
   - `OPENROUTER_API_KEY`: your key (server-side only).
   - `FREEAI_MODEL`: `openrouter/free`.
   - `FREEAI_ALLOWED_ORIGINS`: the exact deployed origin, e.g. `https://your-freeai-project.vercel.app`. Add localhost only for local development.
   - `FREEAI_SITE_URL`: optional deployed URL used as the provider's HTTP referer.
4. Redeploy after setting the variables.
5. For local development, copy `.env.example` to `.env.local`, set the values, then run `npm install` and `npm run dev`. Vercel's local dev command can be used to exercise the serverless route.

## Honest limitations of this first version

This is a first working foundation, not yet a ChatGPT/Gemini/Claude feature-parity agent. Web search, browsing, file/image upload and analysis, code execution, durable abuse/rate limiting, cloud-synced accounts, user settings, and multi-step tool execution are not implemented yet. A model response is not proof that an external task was performed. Add these features in explicit, testable stages.

The free provider has its own quotas and model availability; a key is required to call it. This repository does not include a provider key. No deployment or build is claimed by this README.
