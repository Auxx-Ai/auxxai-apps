// src/tools/shared/map-message.ts

/**
 * Tool-surface mapper for a Discord message. Drops fields the LLM rarely
 * reasons over (mentions, embeds, referenced_message) and exposes the
 * trimmed shape declared in the zod outputs. See plan §4.4 / §7.
 */

export interface MappedAttachment {
  url: string
  filename: string
  contentType: string | null
}

export interface MappedReaction {
  emoji: string
  count: number
}

export interface MappedMessage {
  messageId: string
  channelId: string
  content: string
  authorId: string
  authorUsername: string
  authorBot: boolean
  timestamp: string
  editedAt: string | null
  attachments: MappedAttachment[]
  reactions: MappedReaction[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMessage(raw: any): MappedMessage {
  return {
    messageId: raw.id ?? '',
    channelId: raw.channel_id ?? '',
    content: raw.content ?? '',
    authorId: raw.author?.id ?? '',
    authorUsername: raw.author?.username ?? '',
    authorBot: Boolean(raw.author?.bot),
    timestamp: raw.timestamp ?? '',
    editedAt: raw.edited_timestamp ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachments: (raw.attachments ?? []).map((a: any) => ({
      url: a.url ?? '',
      filename: a.filename ?? '',
      contentType: a.content_type ?? null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reactions: (raw.reactions ?? []).map((r: any) => ({
      emoji: r.emoji?.id ? `${r.emoji?.name}:${r.emoji.id}` : (r.emoji?.name ?? ''),
      count: typeof r.count === 'number' ? r.count : 0,
    })),
  }
}

export interface MappedMessageMatch {
  messageId: string
  channelId: string
  channelName: string
  content: string
  authorId: string
  authorUsername: string
  timestamp: string
}

export function mapMessageMatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  channelId: string,
  channelName: string
): MappedMessageMatch {
  return {
    messageId: raw.id ?? '',
    channelId,
    channelName,
    content: raw.content ?? '',
    authorId: raw.author?.id ?? '',
    authorUsername: raw.author?.username ?? '',
    timestamp: raw.timestamp ?? '',
  }
}
