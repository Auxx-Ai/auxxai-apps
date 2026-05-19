// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Telegram toolsets exposed to agents. The platform projects each `id` into
 * the runtime slug namespace as `app:telegram:<localId>` for agent-side
 * filtering. See plans/kopilot/apps/telegram-overhaul.md §5.
 *
 * Read/write split: the four idempotent lookups live in
 * `telegram.chats.read`; the four message-lifecycle writes
 * (send/reply/edit/delete) live in `telegram.messages.write`. Selection is
 * the approval — read-only agents simply don't get the `.write` toolset.
 *
 * No discovery toolset — the Telegram Bot API has no endpoint that lists
 * chats a bot is a member of. Chat ids arrive from the trigger context
 * instead. See plans/kopilot/apps/telegram-overhaul.md §3 decision #10.
 */
export const telegramToolsets: Toolset[] = [
  {
    id: 'telegram.chats.read',
    name: 'Telegram chat info',
    description:
      'Look up chat metadata, administrators, member status, and resolve file ids to download URLs.',
    tools: [
      'get_telegram_chat',
      'get_telegram_chat_administrators',
      'get_telegram_chat_member',
      'get_telegram_file',
    ],
  },
  {
    id: 'telegram.messages.write',
    name: 'Telegram messages',
    description: 'Send, reply, edit, and delete Telegram messages on behalf of the connected bot.',
    tools: [
      'send_telegram_message',
      'reply_to_telegram_message',
      'edit_telegram_message',
      'delete_telegram_message',
    ],
  },
]
