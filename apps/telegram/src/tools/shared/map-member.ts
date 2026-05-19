// src/tools/shared/map-member.ts

export type MemberStatus = 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked'

export interface MappedMember {
  status: MemberStatus
  userId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  isBot: boolean
}

function memberStatus(raw: unknown): MemberStatus {
  if (
    raw === 'creator' ||
    raw === 'administrator' ||
    raw === 'member' ||
    raw === 'restricted' ||
    raw === 'left' ||
    raw === 'kicked'
  ) {
    return raw
  }
  return 'left'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMember(raw: any): MappedMember {
  const user = raw?.user ?? {}
  return {
    status: memberStatus(raw?.status),
    userId: user.id != null ? String(user.id) : '',
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
    isBot: Boolean(user.is_bot),
  }
}
