import { Workflow } from '@auxx/sdk'

export const fileInputs = {
  // --- File: Create ---
  createFilePath: Workflow.string({
    label: 'File Path',
    placeholder: 'docs/README.md',
    acceptsVariables: true,
  }),
  createFileContent: Workflow.string({
    label: 'Content',
    placeholder: 'File content...',
    acceptsVariables: true,
  }),
  createFileCommitMessage: Workflow.string({
    label: 'Commit Message',
    placeholder: 'Add new file',
    acceptsVariables: true,
  }),
  createFileBranch: Workflow.string({
    label: 'Branch',
    description: 'Target branch (defaults to repo default branch)',
    placeholder: 'main',
    acceptsVariables: true,
  }),

  // --- File: Delete ---
  deleteFilePath: Workflow.string({
    label: 'File Path',
    placeholder: 'docs/old-file.md',
    acceptsVariables: true,
  }),
  deleteFileCommitMessage: Workflow.string({
    label: 'Commit Message',
    placeholder: 'Remove file',
    acceptsVariables: true,
  }),
  deleteFileBranch: Workflow.string({
    label: 'Branch',
    description: 'Target branch',
    placeholder: 'main',
    acceptsVariables: true,
  }),

  // --- File: Edit ---
  editFilePath: Workflow.string({
    label: 'File Path',
    placeholder: 'docs/README.md',
    acceptsVariables: true,
  }),
  editFileContent: Workflow.string({
    label: 'Content',
    placeholder: 'Updated file content...',
    acceptsVariables: true,
  }),
  editFileCommitMessage: Workflow.string({
    label: 'Commit Message',
    placeholder: 'Update file',
    acceptsVariables: true,
  }),
  editFileBranch: Workflow.string({
    label: 'Branch',
    description: 'Target branch',
    placeholder: 'main',
    acceptsVariables: true,
  }),

  // --- File: Get ---
  getFilePath: Workflow.string({
    label: 'File Path',
    placeholder: 'docs/README.md',
    acceptsVariables: true,
  }),
  getFileBranch: Workflow.string({
    label: 'Branch',
    description: 'Branch or ref to read from',
    placeholder: 'main',
    acceptsVariables: true,
  }),

  // --- File: List ---
  listFilePath: Workflow.string({
    label: 'Directory Path',
    description: 'Leave empty for root directory',
    placeholder: 'src/components',
    acceptsVariables: true,
  }),
  listFileBranch: Workflow.string({
    label: 'Branch',
    description: 'Branch or ref',
    placeholder: 'main',
    acceptsVariables: true,
  }),
}

export function fileComputeOutputs(operation: string) {
  switch (operation) {
    case 'create':
    case 'edit':
      return {
        filePath: Workflow.string({ label: 'File Path' }),
        fileSha: Workflow.string({ label: 'File SHA' }),
        commitSha: Workflow.string({ label: 'Commit SHA' }),
        commitUrl: Workflow.string({ label: 'Commit URL' }),
      }
    case 'delete':
      return {
        commitSha: Workflow.string({ label: 'Commit SHA' }),
        commitUrl: Workflow.string({ label: 'Commit URL' }),
      }
    case 'get':
      return {
        fileName: Workflow.string({ label: 'File Name' }),
        filePath: Workflow.string({ label: 'File Path' }),
        fileContent: Workflow.string({ label: 'Content' }),
        fileSha: Workflow.string({ label: 'File SHA' }),
        fileSize: Workflow.string({ label: 'Size (bytes)' }),
      }
    case 'list':
      return {
        files: Workflow.string({ label: 'Files (JSON)' }),
        totalCount: Workflow.string({ label: 'Total Count' }),
      }
    default:
      return {}
  }
}
