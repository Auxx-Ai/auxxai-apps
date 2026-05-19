// src/tools/comment-on-github-pull-request.tool.server.ts

import { getGithubConnection } from './shared/connection'
import { postIssueComment, type PostedComment } from './shared/post-issue-comment'

interface CommentOnGithubPullRequestInput {
  owner: string
  repo: string
  prNumber: number
  body: string
}

export default async function commentOnGithubPullRequest(
  input: CommentOnGithubPullRequestInput
): Promise<PostedComment> {
  const { token } = getGithubConnection()
  return postIssueComment(token, input.owner, input.repo, input.prNumber, input.body)
}
