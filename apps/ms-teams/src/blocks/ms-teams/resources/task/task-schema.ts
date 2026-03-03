// src/blocks/ms-teams/resources/task/task-schema.ts

import { Workflow } from '@auxx/sdk'

export const taskInputs = {
  // --- Task: Create ---
  taskCreateGroup: Workflow.select({
    label: 'Group / Team',
    description: 'Select a group (team) for the plan',
    options: [] as { value: string; label: string }[],
  }),
  taskCreatePlan: Workflow.select({
    label: 'Plan',
    description: 'Select a plan',
    options: [] as { value: string; label: string }[],
  }),
  taskCreateBucket: Workflow.select({
    label: 'Bucket',
    description: 'Select a bucket',
    options: [] as { value: string; label: string }[],
  }),
  taskCreateTitle: Workflow.string({
    label: 'Title',
    description: 'Task title',
    placeholder: 'Enter task title',
    acceptsVariables: true,
  }),
  taskCreateAssignedTo: Workflow.select({
    label: 'Assigned To',
    description: 'Assign to a team member (optional)',
    options: [] as { value: string; label: string }[],
  }),
  taskCreateDueDateTime: Workflow.string({
    label: 'Due Date',
    description: 'Due date in ISO 8601 format (optional)',
    placeholder: '2026-12-31T00:00:00Z',
    acceptsVariables: true,
  }),
  taskCreatePercentComplete: Workflow.number({
    label: '% Complete',
    description: 'Completion percentage 0-100 (optional)',
    default: 0,
    min: 0,
    max: 100,
  }),

  // --- Task: Get ---
  taskGetTaskId: Workflow.string({
    label: 'Task ID',
    description: 'ID of the task to retrieve',
    placeholder: 'Enter task ID',
    acceptsVariables: true,
  }),

  // --- Task: Get Many ---
  taskGetManyTasksFor: Workflow.select({
    label: 'Tasks For',
    description: 'Get tasks for the current user or a specific plan',
    options: [
      { value: 'member', label: 'My Tasks' },
      { value: 'plan', label: 'Plan' },
    ],
    default: 'member',
  }),
  taskGetManyGroup: Workflow.select({
    label: 'Group / Team',
    description: 'Select a group (team)',
    options: [] as { value: string; label: string }[],
  }),
  taskGetManyPlan: Workflow.select({
    label: 'Plan',
    description: 'Select a plan',
    options: [] as { value: string; label: string }[],
  }),
  taskGetManyReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all tasks instead of a limited number',
    default: false,
  }),
  taskGetManyLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of tasks to return',
    default: 50,
  }),

  // --- Task: Update ---
  taskUpdateTaskId: Workflow.string({
    label: 'Task ID',
    description: 'ID of the task to update',
    placeholder: 'Enter task ID',
    acceptsVariables: true,
  }),
  taskUpdateTitle: Workflow.string({
    label: 'Title',
    description: 'New title (optional)',
    placeholder: 'Updated task title',
    acceptsVariables: true,
  }),
  taskUpdateGroup: Workflow.select({
    label: 'Group / Team',
    description: 'Select a group for member/bucket lookup',
    options: [] as { value: string; label: string }[],
  }),
  taskUpdatePlan: Workflow.select({
    label: 'Plan',
    description: 'Move to a different plan (optional)',
    options: [] as { value: string; label: string }[],
  }),
  taskUpdateBucket: Workflow.select({
    label: 'Bucket',
    description: 'Move to a different bucket (optional)',
    options: [] as { value: string; label: string }[],
  }),
  taskUpdateAssignedTo: Workflow.select({
    label: 'Assigned To',
    description: 'Reassign to a member (optional)',
    options: [] as { value: string; label: string }[],
  }),
  taskUpdateDueDateTime: Workflow.string({
    label: 'Due Date',
    description: 'Update due date in ISO 8601 format (optional)',
    placeholder: '2026-12-31T00:00:00Z',
    acceptsVariables: true,
  }),
  taskUpdatePercentComplete: Workflow.number({
    label: '% Complete',
    description: 'Update completion percentage 0-100 (optional)',
    min: 0,
    max: 100,
  }),

  // --- Task: Delete ---
  taskDeleteTaskId: Workflow.string({
    label: 'Task ID',
    description: 'ID of the task to delete',
    placeholder: 'Enter task ID',
    acceptsVariables: true,
  }),
}

export function taskComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      taskId: Workflow.string({ label: 'Task ID' }),
      title: Workflow.string({ label: 'Title' }),
      planId: Workflow.string({ label: 'Plan ID' }),
      bucketId: Workflow.string({ label: 'Bucket ID' }),
    }
  }
  if (operation === 'get') {
    return {
      taskId: Workflow.string({ label: 'Task ID' }),
      title: Workflow.string({ label: 'Title' }),
      planId: Workflow.string({ label: 'Plan ID' }),
      bucketId: Workflow.string({ label: 'Bucket ID' }),
      assignedTo: Workflow.string({ label: 'Assigned To (JSON)' }),
      dueDateTime: Workflow.string({ label: 'Due Date' }),
      percentComplete: Workflow.string({ label: '% Complete' }),
      createdDateTime: Workflow.string({ label: 'Created Date' }),
    }
  }
  if (operation === 'getMany') {
    return {
      tasks: Workflow.array({
        label: 'Tasks',
        items: Workflow.struct({
          id: Workflow.string({ label: 'ID' }),
          title: Workflow.string({ label: 'Title' }),
          planId: Workflow.string({ label: 'Plan ID' }),
          bucketId: Workflow.string({ label: 'Bucket ID' }),
        }),
      }),
      totalCount: Workflow.string({ label: 'Total Count' }),
    }
  }
  if (operation === 'update') {
    return {
      taskId: Workflow.string({ label: 'Task ID' }),
      title: Workflow.string({ label: 'Title' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  return {}
}
