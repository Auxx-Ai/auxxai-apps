// src/tools/search-github-repos.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import searchGithubReposExecute from './search-github-repos.tool.server'

export const searchGithubReposTool = defineTool({
  id: 'search_github_repos',
  name: 'Search GitHub repositories',
  description:
    "Search the connected GitHub account's repositories by name, owner, language, or topic. Use this when the user names a repo by partial string — never fetch the full repo list.",
  icon: githubIcon,
  inputs: z.object({
    query: z
      .string()
      .describe(
        'Free-text search across repo name, owner, description, topics, language. Required — the LLM must guess at least a partial name.'
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .describe('Default 10. Hard max 25 (context budget).'),
    owner: z
      .string()
      .optional()
      .describe('Restrict to a specific owner/org login. Useful for "what repos does org X have?"'),
  }),
  outputs: z.object({
    repos: z.array(
      z.object({
        owner: z.string().describe('Owner login.'),
        name: z.string().describe('Repo name without the owner.'),
        fullName: z.string().describe('`<owner>/<name>` — pass this to subsequent tools.'),
        description: z.string().nullable(),
        defaultBranch: z
          .string()
          .describe('Use as the default for `branch` inputs in PR / file tools.'),
        private: z.boolean(),
        primaryLanguage: z.string().nullable(),
        stars: z.number().int(),
        url: z.string().describe('HTML URL on github.com.'),
      })
    ),
    truncated: z.boolean().describe('True if more matches exist beyond `limit`.'),
  }),
  exampleOutput: {
    repos: [
      {
        owner: 'octocat',
        name: 'hello-world',
        fullName: 'octocat/hello-world',
        description: 'My first repository on GitHub!',
        defaultBranch: 'main',
        private: false,
        primaryLanguage: 'TypeScript',
        stars: 1284,
        url: 'https://github.com/octocat/hello-world',
      },
      {
        owner: 'octocat',
        name: 'spoon-knife',
        fullName: 'octocat/spoon-knife',
        description: null,
        defaultBranch: 'main',
        private: false,
        primaryLanguage: 'HTML',
        stars: 412,
        url: 'https://github.com/octocat/spoon-knife',
      },
    ],
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: searchGithubReposExecute,
  agent: { toolsetSlug: 'github.repos' },
})
