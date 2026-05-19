// src/tools/get-github-issue.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { getGithubConnection } from './shared/connection'
import {
  mapComment,
  mapIssueDetail,
  type MappedComment,
  type MappedIssueDetail,
} from './shared/map-issue'
import { GET_ISSUE_QUERY } from './shared/queries'

interface GetGithubIssueInput {
  owner: string
  repo: string
  issueNumber: number
  includeComments?: boolean
  commentsLimit?: number
}

interface GetGithubIssueOutput extends MappedIssueDetail {
  comments: MappedComment[]
  commentsTruncated: boolean
}

interface IssueWithCommentsNode {
  comments?: {
    nodes?: Parameters<typeof mapComment>[0][] | null
    pageInfo?: { hasPreviousPage?: boolean | null } | null
    totalCount?: number | null
  } | null
}

export default async function getGithubIssue(
  input: GetGithubIssueInput
): Promise<GetGithubIssueOutput> {
  const { token } = getGithubConnection()
  const includeComments = input.includeComments ?? true
  const commentsLimit = includeComments ? Math.min(input.commentsLimit ?? 25, 50) : 0

  const { data } = await githubGraphql<{
    repository: {
      issue: (Parameters<typeof mapIssueDetail>[0] & IssueWithCommentsNode) | null
    } | null
  }>(
    GET_ISSUE_QUERY,
    {
      owner: input.owner,
      repo: input.repo,
      number: input.issueNumber,
      commentsLimit: Math.max(commentsLimit, 1),
    },
    token
  )

  const raw = data.repository?.issue
  if (!raw) {
    const err = new Error(
      `Issue #${input.issueNumber} not found in ${input.owner}/${input.repo}.`
    ) as Error & { code: string }
    err.code = 'NOT_FOUND'
    throw err
  }

  const detail = mapIssueDetail(raw)
  const commentNodes = includeComments ? (raw.comments?.nodes ?? []).filter(Boolean) : []
  const comments = commentNodes.map((n) => mapComment(n as Parameters<typeof mapComment>[0]))
  comments.reverse()
  const commentsTruncated = includeComments
    ? Boolean(raw.comments?.pageInfo?.hasPreviousPage)
    : false

  return { ...detail, comments, commentsTruncated }
}
