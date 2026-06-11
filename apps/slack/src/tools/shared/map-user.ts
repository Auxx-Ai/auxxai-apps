// src/tools/shared/map-user.ts

/**
 * Tool-surface mapper for a Slack user (users.info / users.list / users.lookupByEmail).
 *
 * Includes `auxxRecordId` ref resolution via the user's primary email.
 * See plans/kopilot/apps/slack-overhaul.md §6.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { resolveContactRefByEmail } from './resolve-contact-ref'

export interface MappedSlackUser {
  id: string
  name: string
  realName: string | null
  email: string | null
  isBot: boolean
  isDeleted: boolean
  auxxRecordId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

export async function mapUser(
  // biome-ignore lint/suspicious/noExplicitAny: Slack API responses are weakly typed.
  u: any,
  ctx: ToolExecuteContext | undefined
): Promise<MappedSlackUser> {
  const email = u?.profile?.email ? String(u.profile.email) : null
  const recordId = await resolveContactRefByEmail(email)
  return {
    id: String(u?.id ?? ''),
    name: String(u?.profile?.display_name || u?.real_name || u?.name || ''),
    realName: u?.real_name ? String(u.real_name) : null,
    email,
    isBot: Boolean(u?.is_bot),
    isDeleted: Boolean(u?.deleted),
    auxxRecordId: recordId,
    notImportedReason: recordId ? null : 'NOT_IMPORTED',
  }
}
