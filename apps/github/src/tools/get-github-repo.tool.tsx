// src/tools/get-github-repo.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import getGithubRepoExecute from './get-github-repo.tool.server'

export const getGithubRepoTool = defineTool({
  id: 'get_github_repo',
  name: 'Get GitHub repository',
  description:
    'Fetch metadata for a single GitHub repository — default branch, language, topics, open issue / PR counts, last push, visibility. Use after search_github_repos when the user asks for repo-specific facts.',
  icon: githubIcon,
  inputs: z.object({
    owner: z.string().describe('Owner login from search_github_repos.fullName.'),
    repo: z.string().describe('Repo name from search_github_repos.fullName.'),
  }),
  outputs: z.object({
    owner: z.string(),
    name: z.string(),
    fullName: z.string(),
    description: z.string().nullable(),
    defaultBranch: z.string(),
    visibility: z.enum(['public', 'private', 'internal']),
    homepageUrl: z.string().nullable(),
    url: z.string(),
    primaryLanguage: z.string().nullable(),
    topics: z.array(z.string()),
    stars: z.number().int(),
    forks: z.number().int(),
    openIssuesCount: z.number().int(),
    openPullRequestsCount: z
      .number()
      .int()
      .describe(
        'Open PR count. REST conflates issues+PRs in `open_issues_count`; GraphQL splits them, so we expose both separately.'
      ),
    archived: z.boolean(),
    pushedAt: z.string().describe('ISO 8601 of the last commit.'),
  }),
  exampleOutput: {
    owner: 'octocat',
    name: 'hello-world',
    fullName: 'octocat/hello-world',
    description: 'My first repository on GitHub!',
    defaultBranch: 'main',
    visibility: 'public',
    homepageUrl: 'https://octocat.github.io/hello-world',
    url: 'https://github.com/octocat/hello-world',
    primaryLanguage: 'TypeScript',
    topics: ['cli', 'automation'],
    stars: 1284,
    forks: 312,
    openIssuesCount: 23,
    openPullRequestsCount: 7,
    archived: false,
    pushedAt: '2026-06-07T18:45:00Z',
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getGithubRepoExecute,
  agent: { toolsetSlug: 'github.repos' },
})
