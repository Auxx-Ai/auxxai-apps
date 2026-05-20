// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { githubBlock } from './blocks/github/github.workflow'
import { commentOnGithubIssueTool } from './tools/comment-on-github-issue.tool'
import { commentOnGithubPullRequestTool } from './tools/comment-on-github-pull-request.tool'
import { createGithubIssueTool } from './tools/create-github-issue.tool'
import { findGithubIssueTool } from './tools/find-github-issue.tool'
import { findGithubPullRequestTool } from './tools/find-github-pull-request.tool'
import { getGithubIssueTool } from './tools/get-github-issue.tool'
import { getGithubPullRequestTool } from './tools/get-github-pull-request.tool'
import { getGithubRepoTool } from './tools/get-github-repo.tool'
import { githubFileCreateTool } from './tools/internal/file-create.tool'
import { githubFileDeleteTool } from './tools/internal/file-delete.tool'
import { githubFileEditTool } from './tools/internal/file-edit.tool'
import { githubFileGetTool } from './tools/internal/file-get.tool'
import { githubFileListTool } from './tools/internal/file-list.tool'
import { githubIssueCreateCommentTool } from './tools/internal/issue-create-comment.tool'
import { githubIssueCreateTool } from './tools/internal/issue-create.tool'
import { githubIssueEditTool } from './tools/internal/issue-edit.tool'
import { githubIssueGetTool } from './tools/internal/issue-get.tool'
import { githubIssueLockTool } from './tools/internal/issue-lock.tool'
import { githubReleaseCreateTool } from './tools/internal/release-create.tool'
import { githubReleaseDeleteTool } from './tools/internal/release-delete.tool'
import { githubReleaseGetManyTool } from './tools/internal/release-get-many.tool'
import { githubReleaseGetTool } from './tools/internal/release-get.tool'
import { githubReleaseUpdateTool } from './tools/internal/release-update.tool'
import { githubRepositoryGetIssuesTool } from './tools/internal/repository-get-issues.tool'
import { githubRepositoryGetPullRequestsTool } from './tools/internal/repository-get-pull-requests.tool'
import { githubRepositoryGetTool } from './tools/internal/repository-get.tool'
import { githubReviewCreateTool } from './tools/internal/review-create.tool'
import { githubReviewGetManyTool } from './tools/internal/review-get-many.tool'
import { githubReviewGetTool } from './tools/internal/review-get.tool'
import { githubReviewUpdateTool } from './tools/internal/review-update.tool'
import { reviewGithubPullRequestTool } from './tools/review-github-pull-request.tool'
import { searchGithubIssuesTool } from './tools/search-github-issues.tool'
import { searchGithubPullRequestsTool } from './tools/search-github-pull-requests.tool'
import { searchGithubReposTool } from './tools/search-github-repos.tool'
import { summarizeRecentPrsTool } from './tools/summarize-recent-prs.tool'
import { githubToolsets } from './tools/toolsets'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [githubBlock],
    triggers: [],
  },
  tools: [
    // Agent-surface tools (exposed to LLM via toolsets).
    searchGithubReposTool,
    getGithubRepoTool,
    findGithubIssueTool,
    getGithubIssueTool,
    searchGithubIssuesTool,
    createGithubIssueTool,
    commentOnGithubIssueTool,
    findGithubPullRequestTool,
    getGithubPullRequestTool,
    searchGithubPullRequestsTool,
    summarizeRecentPrsTool,
    commentOnGithubPullRequestTool,
    reviewGithubPullRequestTool,
    // Internal-only tools (no `agent` / `action` keys) — invoked via the
    // GitHub workflow block dispatcher (toolMap).
    githubIssueCreateTool,
    githubIssueCreateCommentTool,
    githubIssueEditTool,
    githubIssueGetTool,
    githubIssueLockTool,
    githubFileCreateTool,
    githubFileDeleteTool,
    githubFileEditTool,
    githubFileGetTool,
    githubFileListTool,
    githubRepositoryGetTool,
    githubRepositoryGetIssuesTool,
    githubRepositoryGetPullRequestsTool,
    githubReleaseCreateTool,
    githubReleaseDeleteTool,
    githubReleaseGetTool,
    githubReleaseGetManyTool,
    githubReleaseUpdateTool,
    githubReviewCreateTool,
    githubReviewGetTool,
    githubReviewGetManyTool,
    githubReviewUpdateTool,
  ],
  toolsets: githubToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">GitHub</TextBlock>
      <TextBlock align="left">
        Manage issues, files, releases, pull requests, and reviews directly from your workflows.
      </TextBlock>
    </>
  )
}
