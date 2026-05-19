// src/tools/shared/map-repo.ts

/**
 * GraphQL `Repository` node → chat-tool shape. Differs from the workflow
 * block's REST flat-stringified mapping: tools return structured shapes for
 * the LLM, workflow blocks return strings for variable splicing. Different
 * consumers — don't share (see plan §7 / Calendar + Shopify lesson).
 */

export interface MappedRepoSummary {
  owner: string
  name: string
  fullName: string
  description: string | null
  defaultBranch: string
  private: boolean
  primaryLanguage: string | null
  stars: number
  url: string
}

export interface MappedRepoDetail extends MappedRepoSummary {
  visibility: 'public' | 'private' | 'internal'
  homepageUrl: string | null
  topics: string[]
  forks: number
  openIssuesCount: number
  openPullRequestsCount: number
  archived: boolean
  pushedAt: string
}

interface RepoSummaryNode {
  owner?: { login: string } | null
  name?: string | null
  nameWithOwner?: string | null
  description?: string | null
  defaultBranchRef?: { name: string } | null
  isPrivate?: boolean | null
  primaryLanguage?: { name: string } | null
  stargazerCount?: number | null
  url?: string | null
}

export function mapRepoSummary(node: RepoSummaryNode): MappedRepoSummary {
  return {
    owner: node.owner?.login ?? '',
    name: node.name ?? '',
    fullName: node.nameWithOwner ?? `${node.owner?.login ?? ''}/${node.name ?? ''}`,
    description: node.description ?? null,
    defaultBranch: node.defaultBranchRef?.name ?? '',
    private: Boolean(node.isPrivate),
    primaryLanguage: node.primaryLanguage?.name ?? null,
    stars: node.stargazerCount ?? 0,
    url: node.url ?? '',
  }
}

interface RepoDetailNode extends RepoSummaryNode {
  visibility?: string | null
  homepageUrl?: string | null
  repositoryTopics?: { nodes?: ({ topic?: { name: string } | null } | null)[] | null } | null
  forkCount?: number | null
  issues?: { totalCount: number } | null
  pullRequests?: { totalCount: number } | null
  isArchived?: boolean | null
  pushedAt?: string | null
}

export function mapRepoDetail(node: RepoDetailNode): MappedRepoDetail {
  const visibility = (node.visibility ?? 'PUBLIC').toLowerCase()
  return {
    ...mapRepoSummary(node),
    visibility: visibility === 'private' || visibility === 'internal' ? visibility : 'public',
    homepageUrl: node.homepageUrl ?? null,
    topics:
      node.repositoryTopics?.nodes
        ?.map((n) => n?.topic?.name ?? '')
        .filter((t): t is string => Boolean(t)) ?? [],
    forks: node.forkCount ?? 0,
    openIssuesCount: node.issues?.totalCount ?? 0,
    openPullRequestsCount: node.pullRequests?.totalCount ?? 0,
    archived: Boolean(node.isArchived),
    pushedAt: node.pushedAt ?? '',
  }
}
