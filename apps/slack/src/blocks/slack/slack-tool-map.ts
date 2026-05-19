// src/blocks/slack/slack-tool-map.ts
//
// Dispatch table — maps `${resource}.${operation}` keys from the block
// schema to the tool id that executes the op. Lives in a plain .ts file
// (not the .workflow.tsx) so the server-side dispatcher can import it
// without dragging in the React/client surface. See plans/kopilot/agents/
// triggers/app-surface-per-app-migration.md §2.5.

export const slackToolMap = {
  'channel.create': 'slack_block_create_channel',
  'channel.get': 'slack_block_get_channel',
  'message.send': 'slack_block_send_message',
  'message.delete': 'slack_block_delete_message',
} as const

export type SlackToolMap = typeof slackToolMap
