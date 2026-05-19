// src/tools/shared/map-user.ts

/**
 * Tool-surface mapper for Microsoft Graph users (`/users`, `/users/{id}`).
 *
 * Includes `auxxRecordId` ref resolution via the user's primary email.
 * Graph's `mail` field is canonical; `userPrincipalName` is the fallback
 * for hybrid AD tenants where `mail` is empty. See
 * plans/kopilot/apps/ms-teams-overhaul.md §6.
 */
import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { resolveContactRefByEmail } from './resolve-contact-ref'

export interface MappedMsTeamsUser {
  id: string
  displayName: string
  email: string | null
  userPrincipalName: string | null
  jobTitle: string | null
  auxxRecordId: string | null
  notImportedReason: 'NOT_IMPORTED' | null
}

function pickEmail(u: { mail?: unknown; userPrincipalName?: unknown }): string | null {
  if (typeof u.mail === 'string' && u.mail.includes('@')) return u.mail
  if (typeof u.userPrincipalName === 'string' && u.userPrincipalName.includes('@')) {
    return u.userPrincipalName
  }
  return null
}

export async function mapUser(
  // biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
  u: any,
  ctx: ToolExecuteContext | undefined
): Promise<MappedMsTeamsUser> {
  const email = pickEmail(u ?? {})
  const recordId = await resolveContactRefByEmail(ctx, email)
  return {
    id: String(u?.id ?? ''),
    displayName: String(u?.displayName ?? ''),
    email,
    userPrincipalName: u?.userPrincipalName ? String(u.userPrincipalName) : null,
    jobTitle: u?.jobTitle ? String(u.jobTitle) : null,
    auxxRecordId: recordId,
    notImportedReason: recordId ? null : 'NOT_IMPORTED',
  }
}
