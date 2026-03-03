export const RESOURCES = [
  { value: 'issue', label: 'Issue' },
  { value: 'file', label: 'File' },
  { value: 'repository', label: 'Repository' },
  { value: 'release', label: 'Release' },
  { value: 'review', label: 'Review' },
] as const

export const OPERATIONS = {
  issue: [
    { value: 'create', label: 'Create' },
    { value: 'createComment', label: 'Create Comment' },
    { value: 'edit', label: 'Edit' },
    { value: 'get', label: 'Get' },
    { value: 'lock', label: 'Lock' },
  ],
  file: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'edit', label: 'Edit' },
    { value: 'get', label: 'Get' },
    { value: 'list', label: 'List' },
  ],
  repository: [
    { value: 'get', label: 'Get' },
    { value: 'getIssues', label: 'Get Issues' },
    { value: 'getPullRequests', label: 'Get Pull Requests' },
  ],
  release: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  review: [
    { value: 'create', label: 'Create' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'create', label: 'Create' },
  { value: 'createComment', label: 'Create Comment' },
  { value: 'delete', label: 'Delete' },
  { value: 'edit', label: 'Edit' },
  { value: 'get', label: 'Get' },
  { value: 'getIssues', label: 'Get Issues' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'getPullRequests', label: 'Get Pull Requests' },
  { value: 'lock', label: 'Lock' },
  { value: 'update', label: 'Update' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  issue: ['create', 'createComment', 'edit', 'get', 'lock'],
  file: ['create', 'delete', 'edit', 'get', 'list'],
  repository: ['get', 'getIssues', 'getPullRequests'],
  release: ['create', 'delete', 'get', 'getMany', 'update'],
  review: ['create', 'get', 'getMany', 'update'],
}
