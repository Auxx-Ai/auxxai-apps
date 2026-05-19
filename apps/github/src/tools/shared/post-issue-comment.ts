// src/tools/shared/post-issue-comment.ts

/**
 * Shared server impl for `comment_on_github_issue` and
 * `comment_on_github_pull_request`. GitHub stores PR comments as issue
 * comments at the API level, so the two tools share this helper but stay
 * separate at the LLM surface for clarity (plan §4.12).
 */
import { githubApi } from '../../blocks/github/shared/github-api'

export interface PostedComment {
  commentId: string
  url: string
  createdAt: string
}

interface RestComment {
  id: number
  html_url: string
  created_at: string
}

export async function postIssueComment(
  token: string,
  owner: string,
  repo: string,
  issueOrPrNumber: number,
  body: string
): Promise<PostedComment> {
  const result = (await githubApi(
    'POST',
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueOrPrNumber}/comments`,
    token,
    { body: { body } }
  )) as RestComment

  return {
    commentId: String(result.id),
    url: result.html_url,
    createdAt: result.created_at,
  }
}
