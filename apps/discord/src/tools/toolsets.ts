// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Discord toolsets exposed to agents. The platform projects each `id` into
 * the runtime slug namespace as `app:discord:<localId>` for agent-side
 * filtering. See plans/kopilot/apps/discord-overhaul.md §5.
 *
 * Read/write split on messages — `send` + `react` live in
 * `discord.messages.write` separate from the read toolset. Selection is
 * the approval: read-only agents simply don't get the `.write` toolset.
 *
 * No `.write` for channels or members in v1 — destructive channel admin
 * and role management stay in the workflow block until a real chat flow
 * needs them.
 *
 * `list_discord_guilds` is intentionally toolset-less — it auto-attaches
 * when any `discord.*` toolset is enabled.
 */
export const discordToolsets: Toolset[] = [
  {
    id: 'discord.channels.read',
    name: 'Discord channels (read)',
    description: 'List and inspect channels in a Discord server.',
    tools: ['list_discord_channels', 'get_discord_channel'],
  },
  {
    id: 'discord.messages.read',
    name: 'Discord messages (read)',
    description:
      'Search recent messages, inspect a single message, and summarize recent activity across channels.',
    tools: ['search_discord_messages', 'get_discord_message', 'summarize_recent_discord_activity'],
  },
  {
    id: 'discord.messages.write',
    name: 'Discord messages (write)',
    description: 'Post messages and add reactions in Discord channels.',
    tools: ['send_discord_message', 'react_to_discord_message'],
  },
  {
    id: 'discord.members.read',
    name: 'Discord members (read)',
    description: 'List members of a Discord server.',
    tools: ['list_discord_members'],
  },
]
