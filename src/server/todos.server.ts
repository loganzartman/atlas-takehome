import { prisma } from '#/db'

export function listTodos() {
  return prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })
}

export function createTodo(data: { title: string }) {
  return prisma.todo.create({ data })
}
