// src/tools/shared/map-member.ts

/**
 * Tool-surface mapper for a Discord guild member. See plan §4.6 / §7.
 */

export interface MappedMember {
  userId: string
  username: string
  displayName: string
  bot: boolean
  roles: string[]
  joinedAt: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMember(raw: any): MappedMember {
  const username = raw.user?.username ?? ''
  return {
    userId: raw.user?.id ?? '',
    username,
    displayName: raw.nick || raw.user?.global_name || username,
    bot: Boolean(raw.user?.bot),
    roles: Array.isArray(raw.roles) ? raw.roles : [],
    joinedAt: raw.joined_at ?? null,
  }
}
