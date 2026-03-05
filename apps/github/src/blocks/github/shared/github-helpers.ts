import { BlockValidationError } from '@auxx/sdk/shared'

export function resolveOwnerRepo(input: Record<string, any>): { owner: string; repo: string } {
  const mode = input.repoMode ?? 'list'

  if (mode === 'list') {
    const fullName = input.repoList?.trim()
    if (!fullName) {
      throw new BlockValidationError([
        { field: 'repoList', message: 'Please select a repository.' },
      ])
    }
    const [owner, repo] = fullName.split('/')
    return { owner, repo }
  }

  // mode === 'full-name'
  const fullName = input.repoFullName?.trim()
  if (!fullName || !fullName.includes('/')) {
    throw new BlockValidationError([
      { field: 'repoFullName', message: 'Enter a repository in owner/repo format.' },
    ])
  }
  const [owner, ...rest] = fullName.split('/')
  return { owner, repo: rest.join('/') }
}
