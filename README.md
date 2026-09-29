# atlas-takehome

TanStack Start + tRPC + Prisma (SQLite) skeleton.

## Getting started

```bash
pnpm install
pnpm db:generate   # generate Prisma client into src/generated/prisma
pnpm db:migrate    # apply migrations to the DB in DATABASE_URL (.env.local)
pnpm db:seed       # optional sample todos
pnpm dev
```

## Layout

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Data model (`Todo`) |
| `src/db.ts` | Prisma client singleton |
| `src/server/*.server.ts` | Server-only data access (Prisma queries) |
| `src/server/*.functions.ts` | TanStack Start server functions (`createServerFn`) |
| `src/integrations/trpc/router.ts` | tRPC router, served at `/api/trpc` by `src/routes/api.trpc.$.tsx` |
| `src/routes/` | File-based routes |

`src/routes/index.tsx` shows both data paths end to end: the todo list is
loaded through tRPC (`todos.list`, prefetched in the route loader for SSR),
and new todos are created through the `addTodo` server function, which then
invalidates the tRPC query.

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm preview`
- `pnpm lint` / `pnpm format` / `pnpm check` (Biome)
- `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` / `db:seed`
