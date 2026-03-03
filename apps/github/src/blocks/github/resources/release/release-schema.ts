import { Workflow } from '@auxx/sdk'

export const releaseInputs = {
  // --- Release: Create ---
  createReleaseTag: Workflow.string({
    label: 'Tag Name',
    placeholder: 'v1.0.0',
    acceptsVariables: true,
  }),
  createReleaseName: Workflow.string({
    label: 'Release Name',
    placeholder: 'Version 1.0.0',
    acceptsVariables: true,
  }),
  createReleaseBody: Workflow.string({
    label: 'Release Notes',
    placeholder: 'What changed in this release...',
    acceptsVariables: true,
  }),
  createReleaseDraft: Workflow.boolean({
    label: 'Draft',
    default: false,
  }),
  createReleasePrerelease: Workflow.boolean({
    label: 'Pre-release',
    default: false,
  }),
  createReleaseTarget: Workflow.string({
    label: 'Target Commitish',
    description: 'Branch or SHA (defaults to default branch)',
    placeholder: 'main',
    acceptsVariables: true,
  }),

  // --- Release: Delete ---
  deleteReleaseId: Workflow.string({
    label: 'Release ID',
    acceptsVariables: true,
  }),

  // --- Release: Get ---
  getReleaseId: Workflow.string({
    label: 'Release ID',
    acceptsVariables: true,
  }),

  // --- Release: Get Many ---
  getManyReleasesReturnAll: Workflow.boolean({
    label: 'Return All',
    default: false,
  }),
  getManyReleasesLimit: Workflow.number({
    label: 'Limit',
    default: 50,
    min: 1,
    max: 100,
  }),

  // --- Release: Update ---
  updateReleaseId: Workflow.string({
    label: 'Release ID',
    acceptsVariables: true,
  }),
  updateReleaseTag: Workflow.string({
    label: 'Tag Name',
    placeholder: 'v1.0.1',
    acceptsVariables: true,
  }),
  updateReleaseName: Workflow.string({
    label: 'Release Name',
    placeholder: 'Version 1.0.1',
    acceptsVariables: true,
  }),
  updateReleaseBody: Workflow.string({
    label: 'Release Notes',
    placeholder: 'Updated release notes...',
    acceptsVariables: true,
  }),
  updateReleaseDraft: Workflow.boolean({
    label: 'Draft',
    default: false,
  }),
  updateReleasePrerelease: Workflow.boolean({
    label: 'Pre-release',
    default: false,
  }),
  updateReleaseTarget: Workflow.string({
    label: 'Target Commitish',
    placeholder: 'main',
    acceptsVariables: true,
  }),
}

export function releaseComputeOutputs(operation: string) {
  switch (operation) {
    case 'create':
      return {
        releaseId: Workflow.string({ label: 'Release ID' }),
        releaseTag: Workflow.string({ label: 'Tag' }),
        releaseUrl: Workflow.string({ label: 'API URL' }),
        releaseHtmlUrl: Workflow.string({ label: 'URL' }),
      }
    case 'delete':
      return {
        deleted: Workflow.string({ label: 'Deleted' }),
      }
    case 'get':
      return {
        releaseId: Workflow.string({ label: 'Release ID' }),
        releaseTag: Workflow.string({ label: 'Tag' }),
        releaseName: Workflow.string({ label: 'Name' }),
        releaseBody: Workflow.string({ label: 'Body' }),
        releaseUrl: Workflow.string({ label: 'API URL' }),
        releaseHtmlUrl: Workflow.string({ label: 'URL' }),
        releaseDraft: Workflow.string({ label: 'Draft' }),
        releasePrerelease: Workflow.string({ label: 'Pre-release' }),
        releaseCreatedAt: Workflow.string({ label: 'Created At' }),
      }
    case 'getMany':
      return {
        releases: Workflow.string({ label: 'Releases (JSON)' }),
        totalCount: Workflow.string({ label: 'Total Count' }),
        truncated: Workflow.string({ label: 'Truncated' }),
      }
    case 'update':
      return {
        releaseId: Workflow.string({ label: 'Release ID' }),
        releaseTag: Workflow.string({ label: 'Tag' }),
        releaseUrl: Workflow.string({ label: 'URL' }),
      }
    default:
      return {}
  }
}
