// src/tools/shared/map-channel.ts

/**
 * Tool-surface mappers for Slack channels (conversations.* responses).
 */

export interface MappedSlackChannel {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number | null
  isArchived: boolean
}

export interface MappedSlackChannelDetail extends MappedSlackChannel {
  topic: string | null
  purpose: string | null
}

export interface MappedSlackChannelFull extends MappedSlackChannelDetail {
  createdAt: string | null
}

// biome-ignore lint/suspicious/noExplicitAny: Slack API responses are weakly typed.
export function mapChannel(c: any): MappedSlackChannel {
  return {
    id: String(c?.id ?? ''),
    name: String(c?.name ?? ''),
    isPrivate: Boolean(c?.is_private),
    memberCount: typeof c?.num_members === 'number' ? c.num_members : null,
    isArchived: Boolean(c?.is_archived),
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Slack API responses are weakly typed.
export function mapChannelDetail(c: any): MappedSlackChannelDetail {
  return {
    ...mapChannel(c),
    topic: c?.topic?.value ? String(c.topic.value) : null,
    purpose: c?.purpose?.value ? String(c.purpose.value) : null,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Slack API responses are weakly typed.
export function mapChannelFull(c: any): MappedSlackChannelFull {
  return {
    ...mapChannelDetail(c),
    createdAt: typeof c?.created === 'number' ? new Date(c.created * 1000).toISOString() : null,
  }
}
