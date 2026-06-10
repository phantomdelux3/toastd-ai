# Toastd Frontend

Next.js (App Router) UI that talks to the deployed Vertex AI Agent Runtime via authenticated server-side proxy routes.

## Setup

```bash
cd frontend
npm install
```

Authenticate against GCP (needed so server-side API routes can mint Bearer tokens for Agent Runtime):

```bash
gcloud auth application-default login
```

Confirm `.env.local` has the right reasoning-engine ID:

```
GCP_PROJECT_NUMBER=698151665057
GCP_LOCATION=us-central1
REASONING_ENGINE_ID=8982788447336923136
```

## Run dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Architecture

- `app/page.tsx` — Homepage hero + suggestion chips.
- `app/chat/page.tsx` (+ `ChatView`) — Chat thread with streaming responses.
- `components/QuestionCard.tsx` — Numbered radio options + "Something else…" textarea per the example design.
- `components/MarkdownMessage.tsx` — Renders product cards from agent markdown.
- `lib/agent.ts` — Server-side helper that handles GCP ADC + Agent Runtime HTTP calls.
- `app/api/session/route.ts` — Creates an Agent Runtime session.
- `app/api/chat/route.ts` — Proxies user messages to `:streamQuery` and pipes back assistant text chunks.
- `lib/parseAssistant.ts` — Extracts `{ type: "question", title, options[] }` JSON from the agent's reply when present, so the UI renders a QuestionCard instead of a markdown bubble.

## Why a server proxy?

Agent Runtime endpoints always require IAM-authenticated requests. The browser cannot hold a service-account credential safely, so all calls go through `/api/session` and `/api/chat`, which use Application Default Credentials on the server.

For production: replace ADC with a service-account key mounted via secret manager, or run on Cloud Run with a service account that has `roles/aiplatform.user` on the project.
