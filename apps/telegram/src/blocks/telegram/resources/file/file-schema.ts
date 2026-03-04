import { Workflow } from '@auxx/sdk'

export const fileInputs = {
  getFileId: Workflow.string({
    label: 'File ID',
    acceptsVariables: true,
  }),
}

export function fileComputeOutputs(operation: string) {
  switch (operation) {
    case 'get':
      return {
        fileId: Workflow.string({ label: 'File ID' }),
        fileUniqueId: Workflow.string({ label: 'File Unique ID' }),
        fileSize: Workflow.string({ label: 'File Size' }),
        filePath: Workflow.string({ label: 'File Path' }),
        downloadUrl: Workflow.string({ label: 'Download URL' }),
      }
    default:
      return {}
  }
}
