import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { useTRPC } from '#/integrations/trpc/react'
import { addTodo } from '#/server/todos.functions'

export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    context.queryClient.query(context.trpc.todos.list.queryOptions()),
  component: App,
})

function App() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: todos = [] } = useQuery(trpc.todos.list.queryOptions())

  const [title, setTitle] = useState('')
  const addTodoFn = useServerFn(addTodo)
  const add = useMutation({
    mutationFn: (title: string) => addTodoFn({ data: { title } }),
    onSuccess: async () => {
      setTitle('')
      await queryClient.invalidateQueries({
        queryKey: trpc.todos.list.queryKey(),
      })
    },
  })

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-4 text-2xl font-bold">Todos</h1>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (title.trim()) add.mutate(title)
        }}
      >
        <input
          className="flex-1 rounded border px-2 py-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New todo"
        />
        <button
          type="submit"
          className="rounded border px-3 py-1"
          disabled={add.isPending}
        >
          Add
        </button>
      </form>
      <ul className="list-disc pl-5">
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </main>
  )
}
