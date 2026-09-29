import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createTodo } from './todos.server'

export const addTodo = createServerFn({ method: 'POST' })
  .validator(z.object({ title: z.string().trim().min(1) }))
  .handler(({ data }) => createTodo(data))
