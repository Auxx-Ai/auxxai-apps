// src/tools/shared/map-message.ts

/**
 * Tool-surface mappers for Slack messages
 * (conversations.history, conversations.replies, search.messages results).
 */

export interface MappedSlackMessage {
  ts: string
  userId: string | null
  text: string
  threadTs: string | null
  replyCount: number
}

export interface MappedSearchHit {
  ts: string
  channelId: string
  channelName: string
  userId: string | null
  text: string
  permalink: string
}

// biome-ignore lint/suspicious/noExplicitAny: Slack API responses are weakly typed.
export function mapMessage(m: any): MappedSlackMessage {
  return {
    ts: String(m?.ts ?? ''),
    userId: m?.user ? String(m.user) : null,
    text: String(m?.text ?? ''),
    threadTs: m?.thread_ts ? String(m.thread_ts) : null,
    replyCount: typeof m?.reply_count === 'number' ? m.reply_count : 0,
  }
}

export interface MappedThreadMessage {
  ts: string
  userId: string | null
  text: string
}

// biome-ignore lint/suspicious/noExplicitAny: Slack API responses are weakly typed.
export function mapThreadMessage(m: any): MappedThreadMessage {
  return {
    ts: String(m?.ts ?? ''),
    userId: m?.user ? String(m.user) : null,
    text: String(m?.text ?? ''),
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Slack API responses are weakly typed.
export function mapSearchHit(m: any): MappedSearchHit {
  return {
    ts: String(m?.ts ?? ''),
    channelId: String(m?.channel?.id ?? ''),
    channelName: String(m?.channel?.name ?? ''),
    userId: m?.user ? String(m.user) : null,
    text: String(m?.text ?? ''),
    permalink: String(m?.permalink ?? ''),
  }
}
