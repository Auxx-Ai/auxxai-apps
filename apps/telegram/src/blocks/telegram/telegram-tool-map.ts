// src/blocks/telegram/telegram-tool-map.ts
//
// Dispatch table — maps `${resource}.${operation}` keys from the block
// schema to the tool id that executes the op. Lives in a plain .ts file
// (not the .workflow.tsx) so the server-side dispatcher can import it
// without dragging in the React/client surface. See plans/kopilot/agents/
// triggers/app-surface-per-app-migration.md §2.5.

export const telegramToolMap = {
  'message.sendMessage': 'telegram_block_send_message',
  'message.editMessageText': 'telegram_block_edit_message_text',
  'message.deleteMessage': 'telegram_block_delete_message',
  'message.pinMessage': 'telegram_block_pin_message',
  'message.unpinMessage': 'telegram_block_unpin_message',
  'message.sendChatAction': 'telegram_block_send_chat_action',
  'message.sendPhoto': 'telegram_block_send_photo',
  'message.sendDocument': 'telegram_block_send_document',
  'message.sendVideo': 'telegram_block_send_video',
  'message.sendAudio': 'telegram_block_send_audio',
  'message.sendAnimation': 'telegram_block_send_animation',
  'message.sendSticker': 'telegram_block_send_sticker',
  'message.sendLocation': 'telegram_block_send_location',
  'message.sendMediaGroup': 'telegram_block_send_media_group',
  'chat.get': 'telegram_block_get_chat',
  'chat.getAdministrators': 'telegram_block_get_chat_administrators',
  'chat.getMember': 'telegram_block_get_chat_member',
  'chat.leave': 'telegram_block_leave_chat',
  'chat.setDescription': 'telegram_block_set_chat_description',
  'chat.setTitle': 'telegram_block_set_chat_title',
  'callback.answerQuery': 'telegram_block_answer_callback_query',
  'callback.answerInlineQuery': 'telegram_block_answer_inline_query',
  'file.get': 'telegram_block_get_file',
} as const

export type TelegramToolMap = typeof telegramToolMap
