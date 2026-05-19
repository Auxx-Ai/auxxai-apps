// src/tools/find-github-issue.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { getGithubConnection } from './shared/connection'
import { mapIssueSummary, type MappedIssueSummary } from './shared/map-issue'
import { FIND_ISSUE_BY_NUMBER_QUERY, FIND_ISSUE_BY_QUERY } from './shared/queries'

interface FindGithubIssueInput {
  owner: string
  repo: string
  issueNumber?: number
  titleQuery?: string
}

interface FindGithubIssueOutput {
  found: boolean
  issue: MappedIssueSummary | null
}

export default async function findGithubIssue(
  input: FindGithubIssueInput
): Promise<FindGithubIssueOutput> {
  // XOR check covers the .refine() stripped by the JSON Schema converter.
  if (Number(input.issueNumber != null) + Number(!!input.titleQuery) !== 1) {
    const err = new Error('Provide exactly one of issueNumber or titleQuery.') as Error & {
      code: string
    }
    err.code = 'INVALID_INPUT'
    throw err
  }

  const { token } = getGithubConnection()

  if (input.issueNumber != null) {
    const { data } = await githubGraphql<{
      repository: { issue: Parameters<typeof mapIssueSummary>[0] | null } | null
    }>(
      FIND_ISSUE_BY_NUMBER_QUERY,
      { owner: input.owner, repo: input.repo, number: input.issueNumber },
      token
    )
    const raw = data.repository?.issue
    if (!raw) return { found: false, issue: null }
    return { found: true, issue: mapIssueSummary(raw) }
  }

  const q = `repo:${input.owner}/${input.repo} is:issue in:title ${input.titleQuery}`
  const { data } = await githubGraphql<{ search: { nodes: unknown[] } }>(
    FIND_ISSUE_BY_QUERY,
    { query: q },
    token
  )
  const raw = (data.search?.nodes ?? [])[0] as Parameters<typeof mapIssueSummary>[0] | undefined
  if (!raw) return { found: false, issue: null }
  return { found: true, issue: mapIssueSummary(raw) }
}
