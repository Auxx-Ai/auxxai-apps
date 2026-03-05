// src/blocks/whatsapp/resources/media/media-schema.ts

import { Workflow } from '@auxx/sdk'

export const mediaInputs = {
  // upload
  uploadPhoneNumberId: Workflow.select({
    label: 'From Phone Number',
    description: 'WhatsApp phone number for media upload',
    options: [],
    acceptsVariables: true,
  }),
  uploadMediaUrl: Workflow.string({
    label: 'Media URL',
    description: 'Public URL of the file to upload',
    acceptsVariables: true,
  }),

  // getUrl
  getUrlMediaId: Workflow.string({
    label: 'Media ID',
    description: 'WhatsApp media ID to retrieve URL for',
    acceptsVariables: true,
  }),

  // delete
  deleteMediaId: Workflow.string({
    label: 'Media ID',
    description: 'WhatsApp media ID to delete',
    acceptsVariables: true,
  }),
}

const uploadOutputs = {
  mediaId: Workflow.string({ label: 'Media ID' }),
}

const getUrlOutputs = {
  mediaId: Workflow.string({ label: 'Media ID' }),
  mediaUrl: Workflow.string({ label: 'Media URL' }),
  mimeType: Workflow.string({ label: 'MIME Type' }),
  fileSize: Workflow.number({ label: 'File Size (bytes)' }),
  sha256: Workflow.string({ label: 'SHA256 Hash' }),
}

const deleteOutputs = {
  success: Workflow.boolean({ label: 'Success' }),
}

export function mediaComputeOutputs(operation: string) {
  switch (operation) {
    case 'upload':
      return uploadOutputs
    case 'getUrl':
      return getUrlOutputs
    case 'delete':
      return deleteOutputs
    default:
      return {}
  }
}
