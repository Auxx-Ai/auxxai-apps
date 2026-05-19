// src/triggers/app-mention/app-mention-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const appMentionInputs = {}

export const appMentionOutputs = {
  teamId: Workflow.string({ label: 'Team ID' }),
  channelId: Workflow.string({ label: 'Channel ID' }),
  userId: Workflow.string({ label: 'User ID' }),
  text: Workflow.string({ label: 'Message Text' }),
  ts: Workflow.string({ label: 'Message TS' }),
  threadTs: Workflow.string({ label: 'Thread TS' }),
  botUserId: Workflow.string({ label: 'Bot User ID' }),
}

export const appMentionSchema = {
  inputs: appMentionInputs,
  outputs: appMentionOutputs,
} satisfies WorkflowSchema
