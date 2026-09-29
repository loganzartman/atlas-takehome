# atlas-takehome

LLM travel planner POC: TanStack Start + TanStack AI (OpenRouter) + tRPC +
Prisma (SQLite).

## Getting started

Create `.env.local` file:

```
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY="<your-secret-key>"
OPENROUTER_MODEL="qwen/qwen3.8-27b"
```

Run setup:

```bash
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash

nvm install
corepack enable
pnpm install

pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Layout

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Trips, trip profile, priorities, chat persistence tables |
| `src/lib/trip-profile.ts` | Zod schema for the trip profile (checked against Prisma at compile time) and the planning checklist |
| `src/db.ts` | Prisma client singleton |
| `src/server/*.server.ts` | Server-only data access, including the chat persistence stores |
| `src/server/trip-agent.server.ts` | The agent's tools (`update_profile`, `update_priorities`, `get_destination_info`) and per-turn system prompt |
| `src/server/destinations.server.ts` | Mock destination data behind `get_destination_info` |
| `src/integrations/trpc/router.ts` | tRPC router (`trips.*`), served at `/api/trpc` |
| `src/routes/api.chat.ts` | Chat endpoint: `POST` streams a reply over SSE, `GET` loads a trip's history |
| `src/routes/` | File-based routes (`/` trip list, `/trips/$tripId` chat) |

## Data model

- **Trip**: one conversation. `Trip.id` is also the chat `threadId`.
- **TripProfile**: the source of truth for what's locked in. Its fields mirror
  `tripProfileSchema`.
- **ProfilePriority**: sort order (and "skipped") for the planning items in
  `PLAN_ITEMS`. Whether an item is done comes from the profile, never from
  here.
- **ChatThread / ChatRun**: owned by `@tanstack/ai-persistence` (transcript
  JSON per thread; per-turn status, usage and cost).
