// src/tools/shared/map-message.ts

export interface MappedMessage {
  messageId: string
  chatId: string
  text: string
  date: string
}

export interface MappedReplyMessage extends MappedMessage {
  replyToMessageId: string
}

export interface MappedEditedMessage {
  messageId: string
  chatId: string
  text: string
  editDate: string
}

function isoFromUnixSeconds(seconds: unknown): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return ''
  return new Date(seconds * 1000).toISOString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMessage(raw: any): MappedMessage {
  return {
    messageId: raw?.message_id != null ? String(raw.message_id) : '',
    chatId: raw?.chat?.id != null ? String(raw.chat.id) : '',
    text: raw?.text ?? '',
    date: isoFromUnixSeconds(raw?.date),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapReplyMessage(raw: any, replyToMessageId: string): MappedReplyMessage {
  return {
    ...mapMessage(raw),
    replyToMessageId,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEditedMessage(raw: any): MappedEditedMessage {
  return {
    messageId: raw?.message_id != null ? String(raw.message_id) : '',
    chatId: raw?.chat?.id != null ? String(raw.chat.id) : '',
    text: raw?.text ?? '',
    editDate: isoFromUnixSeconds(raw?.edit_date ?? raw?.date),
  }
}
