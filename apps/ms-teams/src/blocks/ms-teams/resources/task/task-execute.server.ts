// src/blocks/ms-teams/resources/task/task-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { graphApi, graphPaginatedGet, throwConnectionNotFound } from '../../shared/ms-teams-api'

export async function executeTask(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'create':
      return createTask(token, input)
    case 'delete':
      return deleteTask(token, input)
    case 'get':
      return getTask(token, input)
    case 'getMany':
      return getManyTasks(token, input)
    case 'update':
      return updateTask(token, input)
    default:
      throw new Error(`Unknown task operation: ${operation}`)
  }
}

async function createTask(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const planId = input.taskCreatePlan
  if (!planId)
    throw new BlockValidationError([{ field: 'taskCreatePlan', message: 'Select a plan.' }])

  const bucketId = input.taskCreateBucket
  if (!bucketId)
    throw new BlockValidationError([{ field: 'taskCreateBucket', message: 'Select a bucket.' }])

  const title = input.taskCreateTitle?.trim()
  if (!title)
    throw new BlockValidationError([
      { field: 'taskCreateTitle', message: 'Task title is required.' },
    ])

  const body: Record<string, unknown> = { planId, bucketId, title }

  const assignedTo = input.taskCreateAssignedTo
  if (assignedTo) {
    body.assignments = {
      [assignedTo]: {
        '@odata.type': 'microsoft.graph.plannerAssignment',
        orderHint: ' !',
      },
    }
  }

  if (input.taskCreateDueDateTime?.trim()) {
    body.dueDateTime = input.taskCreateDueDateTime.trim()
  }

  if (input.taskCreatePercentComplete !== undefined && input.taskCreatePercentComplete > 0) {
    body.percentComplete = input.taskCreatePercentComplete
  }

  const result = await graphApi<any>('POST', '/planner/tasks', token, { body })

  return {
    taskId: result.id ?? '',
    title: result.title ?? title,
    planId: result.planId ?? planId,
    bucketId: result.bucketId ?? bucketId,
  }
}

async function getTask(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const taskId = input.taskGetTaskId?.trim()
  if (!taskId)
    throw new BlockValidationError([{ field: 'taskGetTaskId', message: 'Task ID is required.' }])

  const result = await graphApi<any>('GET', `/planner/tasks/${taskId}`, token)

  return {
    taskId: result.id ?? '',
    title: result.title ?? '',
    planId: result.planId ?? '',
    bucketId: result.bucketId ?? '',
    assignedTo: result.assignments ?? {},
    dueDateTime: result.dueDateTime ?? '',
    percentComplete: String(result.percentComplete ?? 0),
    createdDateTime: result.createdDateTime ?? '',
  }
}

async function getManyTasks(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const tasksFor = input.taskGetManyTasksFor ?? 'member'
  const returnAll = input.taskGetManyReturnAll ?? false
  const limit = input.taskGetManyLimit ?? 50

  let endpoint: string

  if (tasksFor === 'plan') {
    const planId = input.taskGetManyPlan
    if (!planId)
      throw new BlockValidationError([{ field: 'taskGetManyPlan', message: 'Select a plan.' }])
    endpoint = `/planner/plans/${planId}/tasks`
  } else {
    endpoint = '/me/planner/tasks'
  }

  const { items, totalCount } = await graphPaginatedGet<any>(endpoint, token, {
    returnAll,
    limit,
  })

  return {
    tasks: items,
    totalCount: String(totalCount),
  }
}

async function updateTask(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const taskId = input.taskUpdateTaskId?.trim()
  if (!taskId)
    throw new BlockValidationError([{ field: 'taskUpdateTaskId', message: 'Task ID is required.' }])

  // GET the task first to obtain the ETag for optimistic concurrency
  const existing = await graphApi<any>('GET', `/planner/tasks/${taskId}`, token)
  const etag = existing['@odata.etag']
  if (!etag) throw new Error('Failed to retrieve ETag for task update.')

  const body: Record<string, unknown> = {}
  if (input.taskUpdateTitle?.trim()) body.title = input.taskUpdateTitle.trim()
  if (input.taskUpdatePercentComplete !== undefined && input.taskUpdatePercentComplete !== '') {
    body.percentComplete = Number(input.taskUpdatePercentComplete)
  }
  if (input.taskUpdateDueDateTime?.trim()) body.dueDateTime = input.taskUpdateDueDateTime.trim()
  if (input.taskUpdateBucket) body.bucketId = input.taskUpdateBucket

  const assignedTo = input.taskUpdateAssignedTo
  if (assignedTo) {
    body.assignments = {
      [assignedTo]: {
        '@odata.type': 'microsoft.graph.plannerAssignment',
        orderHint: ' !',
      },
    }
  }

  await graphApi('PATCH', `/planner/tasks/${taskId}`, token, {
    body,
    headers: { 'If-Match': etag },
  })

  return {
    taskId,
    title: (input.taskUpdateTitle?.trim() as string) ?? existing.title ?? '',
  }
}

async function deleteTask(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const taskId = input.taskDeleteTaskId?.trim()
  if (!taskId)
    throw new BlockValidationError([{ field: 'taskDeleteTaskId', message: 'Task ID is required.' }])

  // GET the task first to obtain the ETag for optimistic concurrency
  const existing = await graphApi<any>('GET', `/planner/tasks/${taskId}`, token)
  const etag = existing['@odata.etag']
  if (!etag) throw new Error('Failed to retrieve ETag for task deletion.')

  await graphApi('DELETE', `/planner/tasks/${taskId}`, token, {
    headers: { 'If-Match': etag },
  })

  return {
    success: 'true',
  }
}
