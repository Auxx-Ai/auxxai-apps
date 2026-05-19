// src/tools/get-github-repo.tool.server.ts

import { githubGraphql } from '../blocks/github/shared/github-graphql'
import { getGithubConnection } from './shared/connection'
import { mapRepoDetail, type MappedRepoDetail } from './shared/map-repo'
import { GET_REPO_QUERY } from './shared/queries'

interface GetGithubRepoInput {
  owner: string
  repo: string
}

export default async function getGithubRepo(input: GetGithubRepoInput): Promise<MappedRepoDetail> {
  const { token } = getGithubConnection()

  const { data } = await githubGraphql<{
    repository: Parameters<typeof mapRepoDetail>[0] | null
  }>(GET_REPO_QUERY, { owner: input.owner, repo: input.repo }, token)

  if (!data.repository) {
    const err = new Error(
      `Repository ${input.owner}/${input.repo} not found or not accessible on the connected account.`
    ) as Error & { code: string }
    err.code = 'NOT_FOUND'
    throw err
  }

  return mapRepoDetail(data.repository)
}
