// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * GitHub toolsets exposed to agents. The platform projects each `id` into
 * the runtime slug namespace as `app:github:<localId>` for agent-side
 * filtering. See plans/kopilot/apps/github-overhaul.md §5.
 *
 * No read/write split: all v1 writes (create issue, comment on issue/PR,
 * APPROVE/COMMENT review) are non-destructive. When destructive writes
 * land (REQUEST_CHANGES, PR merge, file delete, release delete) they get a
 * `github.<resource>.write` split at that point — mirrors Shopify's
 * `orders.read` / `orders.write` granularity logic.
 *
 * No `isDefault`. Master Kopilot sees all three regardless.
 */
export const githubToolsets: Toolset[] = [
  {
    id: 'github.repos',
    name: 'GitHub repositories',
    description:
      'Search GitHub repositories on the connected account and inspect repo metadata (default branch, language, open issue/PR counts).',
    tools: ['search_github_repos', 'get_github_repo'],
  },
  {
    id: 'github.issues',
    name: 'GitHub issues',
    description: 'Find, inspect, search, create, and comment on GitHub issues.',
    tools: [
      'find_github_issue',
      'get_github_issue',
      'search_github_issues',
      'create_github_issue',
      'comment_on_github_issue',
    ],
  },
  {
    id: 'github.pulls',
    name: 'GitHub pull requests',
    description:
      'Find, inspect, search, summarize recent activity, comment on, and post safe reviews (APPROVE / COMMENT) on GitHub pull requests.',
    tools: [
      'find_github_pull_request',
      'get_github_pull_request',
      'search_github_pull_requests',
      'summarize_recent_prs',
      'comment_on_github_pull_request',
      'review_github_pull_request',
    ],
  },
]
