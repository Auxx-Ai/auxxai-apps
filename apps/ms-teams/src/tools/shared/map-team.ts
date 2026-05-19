// src/tools/shared/map-team.ts

/**
 * Tool-surface mapper for Microsoft Teams (the org/team container).
 * Source: `GET /me/joinedTeams` or `GET /teams/{id}`.
 */

export interface MappedMsTeamsTeam {
  id: string
  displayName: string
  description: string | null
}

// biome-ignore lint/suspicious/noExplicitAny: Graph API responses are weakly typed.
export function mapTeam(t: any): MappedMsTeamsTeam {
  return {
    id: String(t?.id ?? ''),
    displayName: String(t?.displayName ?? ''),
    description: t?.description ? String(t.description) : null,
  }
}
