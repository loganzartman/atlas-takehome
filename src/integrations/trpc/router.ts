import { listTodos } from '#/server/todos.server'
import { createTRPCRouter, publicProcedure } from './init'

import type { TRPCRouterRecord } from '@trpc/server'

const todosRouter = {
  list: publicProcedure.query(() => listTodos()),
} satisfies TRPCRouterRecord

export const trpcRouter = createTRPCRouter({
  todos: todosRouter,
})
export type TRPCRouter = typeof trpcRouter
