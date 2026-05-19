// src/tools/create-github-issue.tool.server.ts

import { githubApi } from '../blocks/github/shared/github-api'
import { getGithubConnection } from './shared/connection'

interface CreateGithubIssueInput {
  owner: string
  repo: string
  title: string
  body?: string
  labels?: string[]
  assignees?: string[]
}

interface CreateGithubIssueOutput {
  issueNumber: number
  url: string
  state: 'open'
  createdAt: string
}

interface RestIssue {
  number: number
  html_url: string
  created_at: string
}

export default async function createGithubIssue(
  input: CreateGithubIssueInput
): Promise<CreateGithubIssueOutput> {
  const { token } = getGithubConnection()

  const body: Record<string, unknown> = { title: input.title }
  if (input.body != null) body.body = input.body
  if (input.labels?.length) body.labels = input.labels
  if (input.assignees?.length) body.assignees = input.assignees

  const result = (await githubApi(
    'POST',
    `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/issues`,
    token,
    { body }
  )) as RestIssue

  return {
    issueNumber: result.number,
    url: result.html_url,
    state: 'open',
    createdAt: result.created_at,
  }
}
