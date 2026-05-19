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
