// src/tools/shared/map-channel.ts

/**
 * Tool-surface mappers for Microsoft Teams channels.
 * Source: `GET /teams/{teamId}/channels` or `GET /teams/{teamId}/channels/{id}`.
 */

export type MsTeamsMembershipType = 'standard' | 'private' | 'shared'

export interface MappedMsTeamsChannel {
  id: string
  displayName: string
  description: string | null
  membershipType: MsTeamsMembershipType
}

export interface MappedMsTeamsChannelDetail extends MappedMsTeamsChannel {
  webUrl: string | null
}

export interface MappedMsTeamsChannelFull extends MappedMsTeamsChannelDetail {
  createdAt: string | null
}

function normalizeMembershipType(value: unknown): MsTeamsMembershipType {
  if (value === 'private') return 'private'
  if (value === 'shared') return 'shared'
  return 'standard'
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapChannel(c: any): MappedMsTeamsChannel {
  return {
    id: String(c?.id ?? ''),
    displayName: String(c?.displayName ?? ''),
    description: c?.description ? String(c.description) : null,
    membershipType: normalizeMembershipType(c?.membershipType),
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapChannelDetail(c: any): MappedMsTeamsChannelDetail {
  return {
    ...mapChannel(c),
    webUrl: c?.webUrl ? String(c.webUrl) : null,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapChannelFull(c: any): MappedMsTeamsChannelFull {
  return {
    ...mapChannelDetail(c),
    createdAt: c?.createdDateTime ? String(c.createdDateTime) : null,
  }
}
