// src/tools/comment-on-github-issue.tool.server.ts

import { getGithubConnection } from './shared/connection'
import { postIssueComment, type PostedComment } from './shared/post-issue-comment'

interface CommentOnGithubIssueInput {
  owner: string
  repo: string
  issueNumber: number
  body: string
}

export default async function commentOnGithubIssue(
  input: CommentOnGithubIssueInput
): Promise<PostedComment> {
  const { token } = getGithubConnection()
  return postIssueComment(token, input.owner, input.repo, input.issueNumber, input.body)
}
