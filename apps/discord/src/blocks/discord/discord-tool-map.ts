// src/blocks/discord/discord-tool-map.ts
//
// Dispatch table — maps `${resource}.${operation}` keys from the block
// schema to the tool id that executes the op. Lives in a plain .ts file
// (not the .workflow.tsx) so the server-side dispatcher can import it
// without dragging in the React/client surface. See plans/kopilot/agents/
// triggers/app-surface-per-app-migration.md §2.5.

export const discordToolMap = {
  'channel.create': 'create_discord_channel',
  'channel.update': 'update_discord_channel',
  'channel.delete': 'delete_discord_channel',
  'channel.get': 'get_discord_channel',
  'channel.getMany': 'list_discord_channels',
  'message.send': 'send_discord_message',
  'message.delete': 'delete_discord_message',
  'message.get': 'get_discord_message',
  'message.getMany': 'list_discord_messages',
  'message.react': 'react_to_discord_message',
  'member.getMany': 'list_discord_members',
  'member.roleAdd': 'add_discord_member_role',
  'member.roleRemove': 'remove_discord_member_role',
} as const

export type DiscordToolMap = typeof discordToolMap
