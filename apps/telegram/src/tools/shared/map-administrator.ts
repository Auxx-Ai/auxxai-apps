// src/tools/shared/map-administrator.ts

export interface MappedAdministrator {
  userId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  isBot: boolean
  isCreator: boolean
  canPostMessages: boolean | null
  canDeleteMessages: boolean | null
  canPinMessages: boolean | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAdministrator(raw: any): MappedAdministrator {
  const user = raw?.user ?? {}
  return {
    userId: user.id != null ? String(user.id) : '',
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
    isBot: Boolean(user.is_bot),
    isCreator: raw?.status === 'creator',
    canPostMessages: raw?.can_post_messages ?? null,
    canDeleteMessages: raw?.can_delete_messages ?? null,
    canPinMessages: raw?.can_pin_messages ?? null,
  }
}
