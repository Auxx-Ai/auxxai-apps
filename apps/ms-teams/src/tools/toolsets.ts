// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Microsoft Teams toolsets exposed to agents. Projected to runtime slugs
 * as `app:ms-teams:<localId>`. See plans/kopilot/apps/ms-teams-overhaul.md §5.
 *
 * v1 ships safe writes only — no deletes, no edits, no channel admin,
 * no Planner tasks. Toolset enablement is the approval gate; admins pick
 * deliberately.
 *
 * `list_ms_teams_teams` and `list_ms_teams_chats` are intentionally
 * toolset-less — they auto-attach when any `ms-teams.*` toolset is
 * enabled. Teams' channel-vs-chat duality needs two preflights.
 */
export const msTeamsToolsets: Toolset[] = [
  {
    id: 'ms-teams.channels.read',
    name: 'Microsoft Teams channels (read)',
    description: 'Find and inspect channels within Teams the connected user has joined.',
    tools: ['find_ms_teams_channel', 'list_ms_teams_channels', 'get_ms_teams_channel'],
  },
  {
    id: 'ms-teams.chats.read',
    name: 'Microsoft Teams chats (read)',
    description: 'Find and inspect 1:1 and group chats. Chats are standalone — no parent team.',
    tools: ['find_ms_teams_chat', 'get_ms_teams_chat'],
  },
  {
    id: 'ms-teams.users.read',
    name: 'Microsoft Teams users (read)',
    description:
      'Look up Teams users by email or name. Resolves to Auxx contacts when the email matches.',
    tools: ['find_ms_teams_user', 'get_ms_teams_user'],
  },
  {
    id: 'ms-teams.messages.read',
    name: 'Microsoft Teams messages (read)',
    description:
      'Read recent messages from channels and chats, and fetch reply threads on channel messages.',
    tools: [
      'get_recent_ms_teams_channel_messages',
      'get_recent_ms_teams_chat_messages',
      'get_ms_teams_message_replies',
    ],
  },
  {
    id: 'ms-teams.messages.write',
    name: 'Microsoft Teams messages (write)',
    description:
      'Post messages to channels and chats, and reply within channel threads. No deletes or edits.',
    tools: [
      'send_ms_teams_channel_message',
      'reply_to_ms_teams_channel_message',
      'send_ms_teams_chat_message',
    ],
  },
]
