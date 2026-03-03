// src/blocks/notion/resources/user/user-schema.ts

/**
 * User resource input/output field definitions.
 * Operations: Get, Get Many
 */

import { Workflow } from '@auxx/sdk'

export const userInputs = {
  // --- User: Get ---
  getUserId: Workflow.string({
    label: 'User ID',
    description: 'The Notion user ID',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    acceptsVariables: true,
  }),

  // --- User: Get Many ---
  getManyUserReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Paginate through all results',
    default: false,
  }),
  getManyUserLimit: Workflow.number({
    label: 'Limit',
    description: 'Maximum number of users to return (1-100)',
    default: 100,
    min: 1,
    max: 100,
  }),
}

export function userComputeOutputs(operation: string) {
  if (operation === 'get') {
    return {
      userId: Workflow.string({ label: 'User ID' }),
      name: Workflow.string({ label: 'Name' }),
      email: Workflow.string({ label: 'Email' }),
      type: Workflow.string({ label: 'Type' }),
      avatarUrl: Workflow.string({ label: 'Avatar URL' }),
    }
  }
  if (operation === 'getMany') {
    return {
      users: Workflow.string({ label: 'Users (JSON)' }),
      totalCount: Workflow.string({ label: 'Total Count' }),
    }
  }
  return {}
}
