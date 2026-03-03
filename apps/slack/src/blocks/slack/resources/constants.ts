// src/blocks/slack/resources/constants.ts

/**
 * Resource and operation definitions for the Slack workflow block.
 *
 * Each resource has its own set of valid operations. The operation
 * dropdown in the panel shows only the operations for the selected resource.
 */

export const RESOURCES = [
  { value: 'channel', label: 'Channel' },
  { value: 'message', label: 'Message' },
] as const

export const OPERATIONS = {
  channel: [
    { value: 'create', label: 'Create' },
    { value: 'get', label: 'Get' },
  ],
  message: [
    { value: 'send', label: 'Send' },
    { value: 'delete', label: 'Delete' },
  ],
} as const

/** Union of all operation values (for the schema select options). */
export const ALL_OPERATIONS = [
  { value: 'create', label: 'Create' },
  { value: 'get', label: 'Get' },
  { value: 'send', label: 'Send' },
  { value: 'delete', label: 'Delete' },
] as const

/** Valid resource/operation pairs for server-side validation. */
export const VALID_OPERATIONS: Record<string, string[]> = {
  channel: ['create', 'get'],
  message: ['send', 'delete'],
}
