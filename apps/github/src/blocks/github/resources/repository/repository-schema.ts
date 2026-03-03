import { Workflow } from '@auxx/sdk'

export const repositoryInputs = {
  // --- Repository: Get Issues ---
  getIssuesReturnAll: Workflow.boolean({
    label: 'Return All',
    default: false,
  }),
  getIssuesLimit: Workflow.number({
    label: 'Limit',
    default: 50,
    min: 1,
    max: 100,
  }),
  getIssuesState: Workflow.select({
    label: 'State',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
      { value: 'all', label: 'All' },
    ],
    default: 'open',
  }),
  getIssuesLabels: Workflow.string({
    label: 'Labels',
    description: 'Comma-separated labels to filter by',
    placeholder: 'bug, help wanted',
    acceptsVariables: true,
  }),
  getIssuesAssignee: Workflow.string({
    label: 'Assignee',
    description: 'Username to filter by assignee',
    placeholder: 'octocat',
    acceptsVariables: true,
  }),
  getIssuesSort: Workflow.select({
    label: 'Sort By',
    options: [
      { value: 'created', label: 'Created' },
      { value: 'updated', label: 'Updated' },
      { value: 'comments', label: 'Comments' },
    ],
    default: 'created',
  }),
  getIssuesDirection: Workflow.select({
    label: 'Direction',
    options: [
      { value: 'desc', label: 'Descending' },
      { value: 'asc', label: 'Ascending' },
    ],
    default: 'desc',
  }),
  getIssuesSince: Workflow.string({
    label: 'Since',
    description: 'Only issues updated after this ISO date',
    placeholder: '2024-01-01T00:00:00Z',
    acceptsVariables: true,
  }),

  // --- Repository: Get Pull Requests ---
  getPRsReturnAll: Workflow.boolean({
    label: 'Return All',
    default: false,
  }),
  getPRsLimit: Workflow.number({
    label: 'Limit',
    default: 50,
    min: 1,
    max: 100,
  }),
  getPRsState: Workflow.select({
    label: 'State',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
      { value: 'all', label: 'All' },
    ],
    default: 'open',
  }),
  getPRsSort: Workflow.select({
    label: 'Sort By',
    options: [
      { value: 'created', label: 'Created' },
      { value: 'updated', label: 'Updated' },
      { value: 'popularity', label: 'Popularity' },
      { value: 'long-running', label: 'Long-running' },
    ],
    default: 'created',
  }),
  getPRsDirection: Workflow.select({
    label: 'Direction',
    options: [
      { value: 'desc', label: 'Descending' },
      { value: 'asc', label: 'Ascending' },
    ],
    default: 'desc',
  }),
}

export function repositoryComputeOutputs(operation: string) {
  switch (operation) {
    case 'get':
      return {
        repoName: Workflow.string({ label: 'Name' }),
        repoFullName: Workflow.string({ label: 'Full Name' }),
        repoDescription: Workflow.string({ label: 'Description' }),
        repoUrl: Workflow.string({ label: 'URL' }),
        repoDefaultBranch: Workflow.string({ label: 'Default Branch' }),
        repoPrivate: Workflow.string({ label: 'Private' }),
        repoStars: Workflow.string({ label: 'Stars' }),
        repoForks: Workflow.string({ label: 'Forks' }),
        repoOpenIssues: Workflow.string({ label: 'Open Issues' }),
      }
    case 'getIssues':
      return {
        issues: Workflow.string({ label: 'Issues (JSON)' }),
        totalCount: Workflow.string({ label: 'Total Count' }),
        truncated: Workflow.string({ label: 'Truncated' }),
      }
    case 'getPullRequests':
      return {
        pullRequests: Workflow.string({ label: 'Pull Requests (JSON)' }),
        totalCount: Workflow.string({ label: 'Total Count' }),
        truncated: Workflow.string({ label: 'Truncated' }),
      }
    default:
      return {}
  }
}
