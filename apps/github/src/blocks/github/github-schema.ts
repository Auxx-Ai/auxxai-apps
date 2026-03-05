import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { RESOURCES, ALL_OPERATIONS } from './resources/constants'
import { issueInputs, issueComputeOutputs } from './resources/issue/issue-schema'
import { fileInputs, fileComputeOutputs } from './resources/file/file-schema'
import {
  repositoryInputs,
  repositoryComputeOutputs,
} from './resources/repository/repository-schema'
import { releaseInputs, releaseComputeOutputs } from './resources/release/release-schema'
import { reviewInputs, reviewComputeOutputs } from './resources/review/review-schema'

export const githubSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [...RESOURCES],
      default: 'issue',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: [...ALL_OPERATIONS] as any,
      default: 'create',
    }),

    // Repository mode selector
    repoMode: Workflow.select({
      label: 'Repository',
      description: 'How to specify the repository',
      options: [
        { value: 'list', label: 'From List' },
        { value: 'full-name', label: 'By Full Name' },
      ],
      default: 'list',
    }),

    // Mode: From List — populated dynamically in panel
    repoList: Workflow.select({
      label: 'Repository',
      description: 'Select a repository',
      options: [] as { value: string; label: string }[],
    }),

    // Mode: By Full Name — single combined field
    repoFullName: Workflow.string({
      label: 'Repository',
      placeholder: 'owner/repo',
      acceptsVariables: true,
    }),

    // Resource-specific inputs
    ...issueInputs,
    ...fileInputs,
    ...repositoryInputs,
    ...releaseInputs,
    ...reviewInputs,
  },

  outputs: {},

  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    switch (resource) {
      case 'issue':
        return issueComputeOutputs(operation)
      case 'file':
        return fileComputeOutputs(operation)
      case 'repository':
        return repositoryComputeOutputs(operation)
      case 'release':
        return releaseComputeOutputs(operation)
      case 'review':
        return reviewComputeOutputs(operation)
      default:
        return {}
    }
  },
} satisfies WorkflowSchema
