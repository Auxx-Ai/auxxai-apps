import { Workflow } from '@auxx/sdk'

export const callbackInputs = {
  // --- Answer Query ---
  answerQueryId: Workflow.string({
    label: 'Callback Query ID',
    acceptsVariables: true,
  }),
  answerQueryText: Workflow.string({
    label: 'Text',
    description: 'Notification text (0-200 characters)',
    acceptsVariables: true,
  }),
  answerQueryShowAlert: Workflow.boolean({
    label: 'Show Alert',
    default: false,
  }),
  answerQueryUrl: Workflow.string({
    label: 'URL',
    description: 'URL to open',
    acceptsVariables: true,
  }),
  answerQueryCacheTime: Workflow.number({
    label: 'Cache Time (seconds)',
    default: 0,
  }),

  // --- Answer Inline Query ---
  answerInlineQueryId: Workflow.string({
    label: 'Inline Query ID',
    acceptsVariables: true,
  }),
  answerInlineResults: Workflow.string({
    label: 'Results (JSON)',
    description: 'JSON array of InlineQueryResult objects',
    acceptsVariables: true,
  }),
  answerInlineCacheTime: Workflow.number({
    label: 'Cache Time (seconds)',
    default: 0,
  }),
}

export function callbackComputeOutputs(operation: string) {
  switch (operation) {
    case 'answerQuery':
    case 'answerInlineQuery':
      return {
        success: Workflow.string({ label: 'Success' }),
      }
    default:
      return {}
  }
}
