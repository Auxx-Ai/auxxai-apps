// src/tools/internal/list-repos.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import listGithubReposExecute from './list-repos.tool.server'

/**
 * Internal — lists the connected account's repositories for the GitHub Issues
 * connector's `repo` config picker (`configOptions.repo.optionsFrom`). No agent /
 * action surface; invoked only by the platform's option resolver.
 */
export const githubListReposTool = defineTool({
  id: 'github_list_repos',
  name: 'GitHub: list repositories (config picker)',
  description: "Internal — lists the connected account's repos to back a config dropdown.",
  inputs: z.object({}),
  outputs: z.object({
    repos: z.array(
      z.object({
        fullName: z.string().describe('`<owner>/<name>` — the stored config value.'),
        name: z.string(),
        owner: z.string().nullable(),
        private: z.boolean(),
        description: z.string().nullable(),
      })
    ),
  }),
  exampleOutput: {
    repos: [
      {
        fullName: 'octocat/hello-world',
        name: 'hello-world',
        owner: 'octocat',
        private: false,
        description: 'My first repository on GitHub!',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listGithubReposExecute,
})
