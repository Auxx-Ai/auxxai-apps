// src/tools/shared/map-issue.ts

/**
 * GraphQL `Issue` node → chat-tool shape. See plan §7 — the workflow block's
 * REST mapping returns flat strings for variable splicing; the tool surface
 * returns structured objects.
 */

export interface MappedIssueSummary {
  issueNumber: number
  title: string
  state: 'open' | 'closed'
  author: string | null
  url: string
  createdAt: string
  updatedAt: string
  commentsCount: number
  labels: string[]
  assignees: string[]
}

export interface MappedIssueDetail extends MappedIssueSummary {
  body: string | null
  stateReason: 'completed' | 'not_planned' | 'reopened' | null
  closedAt: string | null
}

export interface IssueNode {
  number?: number | null
  title?: string | null
  state?: string | null
  stateReason?: string | null
  author?: { login?: string | null } | null
  url?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  closedAt?: string | null
  body?: string | null
  labels?: { nodes?: ({ name?: string | null } | null)[] | null } | null
  assignees?: { nodes?: ({ login?: string | null } | null)[] | null } | null
  comments?: { totalCount?: number | null } | null
}

export function mapIssueSummary(node: IssueNode): MappedIssueSummary {
  return {
    issueNumber: node.number ?? 0,
    title: node.title ?? '',
    state: (node.state ?? 'OPEN').toLowerCase() === 'closed' ? 'closed' : 'open',
    author: node.author?.login ?? null,
    url: node.url ?? '',
    createdAt: node.createdAt ?? '',
    updatedAt: node.updatedAt ?? '',
    commentsCount: node.comments?.totalCount ?? 0,
    labels:
      node.labels?.nodes?.map((n) => n?.name ?? '').filter((n): n is string => Boolean(n)) ?? [],
    assignees:
      node.assignees?.nodes?.map((n) => n?.login ?? '').filter((n): n is string => Boolean(n)) ??
      [],
  }
}

export function mapIssueDetail(node: IssueNode): MappedIssueDetail {
  const reason = node.stateReason?.toLowerCase()
  return {
    ...mapIssueSummary(node),
    body: node.body ?? null,
    stateReason:
      reason === 'completed' || reason === 'not_planned' || reason === 'reopened' ? reason : null,
    closedAt: node.closedAt ?? null,
  }
}

export interface CommentNode {
  id?: string | null
  author?: { login?: string | null } | null
  body?: string | null
  createdAt?: string | null
  url?: string | null
}

export interface MappedComment {
  commentId: string
  author: string | null
  body: string
  createdAt: string
  url: string
}

export function mapComment(node: CommentNode): MappedComment {
  return {
    commentId: node.id ?? '',
    author: node.author?.login ?? null,
    body: node.body ?? '',
    createdAt: node.createdAt ?? '',
    url: node.url ?? '',
  }
}
