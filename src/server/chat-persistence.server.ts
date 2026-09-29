// Prisma-backed chat stores for @tanstack/ai-persistence, adapted from its
// build-prisma-adapter recipe. Only the transcript and run stores for now;
// interrupts/metadata get added when we need tool approvals.
import type { ModelMessage, TokenUsage } from '@tanstack/ai'
import { defineAIPersistence } from '@tanstack/ai-persistence'
import type {
  ChatTranscriptPersistence,
  MessageStore,
  RunRecord,
  RunStatus,
  RunStore,
} from '@tanstack/ai-persistence'
import { prisma } from '#/db'
import type { ChatRun, Prisma } from '#/generated/prisma/client'

// Trusts the shape the stores themselves wrote; nothing else writes these
// columns.
function parseJson<T>(raw: string): T {
  return JSON.parse(raw)
}

const RUN_STATUSES: ReadonlyArray<RunStatus> = [
  'running',
  'interrupted',
  'completed',
  'failed',
  'aborted',
]

function toRunStatus(value: string): RunStatus {
  const status = RUN_STATUSES.find((candidate) => candidate === value)
  if (!status) throw new Error(`Unknown run status: ${value}`)
  return status
}

// Records omit absent optionals so they match the reference in-memory store.
function mapRun(row: ChatRun): RunRecord {
  return {
    runId: row.runId,
    threadId: row.threadId,
    status: toRunStatus(row.status),
    startedAt: Number(row.startedAt),
    ...(row.finishedAt != null ? { finishedAt: Number(row.finishedAt) } : {}),
    ...(row.error != null
      ? {
          error: {
            message: row.error,
            ...(row.errorCode != null ? { code: row.errorCode } : {}),
          },
        }
      : {}),
    ...(row.usageJson != null
      ? { usage: parseJson<TokenUsage>(row.usageJson) }
      : {}),
    ...(row.sandboxKey != null ? { sandboxKey: row.sandboxKey } : {}),
    ...(row.detachedSince != null
      ? { detachedSince: Number(row.detachedSince) }
      : {}),
    ...(row.cancelRequested != null
      ? { cancelRequested: row.cancelRequested }
      : {}),
    ...(row.driverEpoch != null ? { driverEpoch: row.driverEpoch } : {}),
    ...(row.parentRunId != null ? { parentRunId: row.parentRunId } : {}),
    ...(row.subagentRunId != null ? { subagentRunId: row.subagentRunId } : {}),
    ...(row.name != null ? { name: row.name } : {}),
  }
}

const messages: MessageStore = {
  async loadThread(threadId) {
    const row = await prisma.chatThread.findUnique({ where: { threadId } })
    // Unknown thread is [], never null.
    return row ? parseJson<Array<ModelMessage>>(row.messagesJson) : []
  },
  // Full overwrite: withPersistence has already merged, so `messages` is the
  // complete transcript.
  async saveThread(threadId, messages) {
    const messagesJson = JSON.stringify(messages)
    const updatedAt = BigInt(Date.now())
    await prisma.chatThread.upsert({
      where: { threadId },
      create: { threadId, messagesJson, updatedAt },
      update: { messagesJson, updatedAt },
    })
  },
}

const runs: RunStore = {
  async get(runId) {
    const row = await prisma.chatRun.findUnique({ where: { runId } })
    return row ? mapRun(row) : null
  },
  // An empty `update` makes this insert-if-absent: an existing run comes back
  // untouched, so resume and double-submit are safe.
  async createOrResume(input) {
    const row = await prisma.chatRun.upsert({
      where: { runId: input.runId },
      create: {
        runId: input.runId,
        threadId: input.threadId,
        status: input.status ?? 'running',
        startedAt: BigInt(input.startedAt),
        ...(input.parentRunId !== undefined
          ? { parentRunId: input.parentRunId }
          : {}),
        ...(input.subagentRunId !== undefined
          ? { subagentRunId: input.subagentRunId }
          : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
      },
      update: {},
    })
    return mapRun(row)
  },
  // Patching an unknown runId is a silent no-op, hence updateMany.
  async update(runId, patch) {
    const data: Prisma.ChatRunUpdateManyMutationInput = {}
    if (patch.status !== undefined) data.status = patch.status
    if (patch.finishedAt !== undefined) {
      data.finishedAt = BigInt(patch.finishedAt)
    }
    // Written together so a later code-less error can't keep a stale code.
    if (patch.error !== undefined) {
      data.error = patch.error.message
      data.errorCode = patch.error.code ?? null
    }
    if (patch.usage !== undefined) data.usageJson = JSON.stringify(patch.usage)
    // `in`, not `!== undefined`: passing one of these explicitly as undefined
    // means "clear it", which must write NULL.
    if ('sandboxKey' in patch) data.sandboxKey = patch.sandboxKey ?? null
    if ('detachedSince' in patch) {
      data.detachedSince =
        patch.detachedSince === undefined ? null : BigInt(patch.detachedSince)
    }
    if ('cancelRequested' in patch) {
      data.cancelRequested = patch.cancelRequested ?? null
    }
    if ('driverEpoch' in patch) data.driverEpoch = patch.driverEpoch ?? null
    if (Object.keys(data).length === 0) return

    await prisma.chatRun.updateMany({ where: { runId }, data })
  },
  async findActiveRun(threadId) {
    const row = await prisma.chatRun.findFirst({
      where: { threadId, status: 'running' },
      orderBy: { startedAt: 'desc' },
    })
    return row ? mapRun(row) : null
  },
  async listByThread(threadId) {
    const rows = await prisma.chatRun.findMany({
      where: { threadId },
      orderBy: { startedAt: 'asc' },
    })
    return rows.map(mapRun)
  },
  async listByParentRun(parentRunId) {
    const rows = await prisma.chatRun.findMany({
      where: { parentRunId },
      orderBy: { startedAt: 'asc' },
    })
    return rows.map(mapRun)
  },
  async listReclaimable({ now, ttlMs }) {
    const rows = await prisma.chatRun.findMany({
      where: {
        status: 'running',
        detachedSince: { not: null, lte: BigInt(now - ttlMs) },
      },
    })
    return rows.map(mapRun)
  },
}

export const chatPersistence: ChatTranscriptPersistence = defineAIPersistence({
  stores: { messages, runs },
})
