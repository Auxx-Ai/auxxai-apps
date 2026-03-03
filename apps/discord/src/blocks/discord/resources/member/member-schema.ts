// src/blocks/discord/resources/member/member-schema.ts

import { Workflow } from '@auxx/sdk'

export const memberInputs = {
  // --- Member: Get Many ---
  getManyMemberGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  getManyMemberReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Fetch all members (up to hard cap)',
    default: false,
  }),
  getManyMemberLimit: Workflow.number({
    label: 'Limit',
    description: 'Max members to return (1-1000)',
    default: 100,
  }),

  // --- Member: Add Role ---
  roleAddGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  roleAddUserId: Workflow.string({
    label: 'User ID',
    description: 'User ID of the member',
    placeholder: '1234567890123456789',
    acceptsVariables: true,
  }),
  roleAddRoles: Workflow.select({
    label: 'Roles',
    description: 'Roles to add',
    options: [] as { value: string; label: string }[],
  }),

  // --- Member: Remove Role ---
  roleRemoveGuild: Workflow.select({
    label: 'Server',
    description: 'Select a Discord server',
    options: [] as { value: string; label: string }[],
  }),
  roleRemoveUserId: Workflow.string({
    label: 'User ID',
    description: 'User ID of the member',
    placeholder: '1234567890123456789',
    acceptsVariables: true,
  }),
  roleRemoveRoles: Workflow.select({
    label: 'Roles',
    description: 'Roles to remove',
    options: [] as { value: string; label: string }[],
  }),
}

export function memberComputeOutputs(operation: string) {
  if (operation === 'getMany') {
    return {
      members: Workflow.array({
        label: 'Members',
        items: Workflow.struct({
          userId: Workflow.string({ label: 'User ID' }),
          username: Workflow.string({ label: 'Username' }),
          displayName: Workflow.string({ label: 'Display Name' }),
        }),
      }),
      totalCount: Workflow.string({ label: 'Total Count' }),
      truncated: Workflow.string({ label: 'Truncated' }),
    }
  }
  if (operation === 'roleAdd') {
    return {
      success: Workflow.string({ label: 'Success' }),
      userId: Workflow.string({ label: 'User ID' }),
      rolesAdded: Workflow.array({ label: 'Roles Added', items: Workflow.string() }),
    }
  }
  if (operation === 'roleRemove') {
    return {
      success: Workflow.string({ label: 'Success' }),
      userId: Workflow.string({ label: 'User ID' }),
      rolesRemoved: Workflow.array({ label: 'Roles Removed', items: Workflow.string() }),
    }
  }
  return {}
}
