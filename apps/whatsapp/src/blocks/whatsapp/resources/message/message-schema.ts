// src/blocks/whatsapp/resources/message/message-schema.ts

import { Workflow } from '@auxx/sdk'

export const messageInputs = {
  phoneNumberId: Workflow.select({
    label: 'From Phone Number',
    description: 'WhatsApp phone number to send from',
    options: [],
    acceptsVariables: true,
  }),
  recipientPhone: Workflow.string({
    label: 'Recipient Phone Number',
    description: 'Phone number with country code (e.g., +1234567890)',
    acceptsVariables: true,
  }),

  // sendText
  sendTextBody: Workflow.string({
    label: 'Message Text',
    description: 'Text content (max 4096 characters)',
    acceptsVariables: true,
  }),
  sendTextPreviewUrl: Workflow.boolean({
    label: 'Preview URL',
    description: 'Show link previews in the message',
    default: false,
  }),

  // sendMedia
  sendMediaType: Workflow.select({
    label: 'Media Type',
    options: [
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' },
      { value: 'audio', label: 'Audio' },
      { value: 'document', label: 'Document' },
    ],
    default: 'image',
  }),
  sendMediaUrl: Workflow.string({
    label: 'Media URL',
    description: 'Public URL of the media file',
    acceptsVariables: true,
  }),
  sendMediaCaption: Workflow.string({
    label: 'Caption',
    description: 'Optional caption for the media',
    acceptsVariables: true,
  }),
  sendMediaFilename: Workflow.string({
    label: 'Filename',
    description: 'Filename for document attachments',
    acceptsVariables: true,
  }),

  // sendTemplate
  sendTemplateId: Workflow.select({
    label: 'Template',
    description: 'Message template to send',
    options: [],
    acceptsVariables: true,
  }),
  sendTemplateComponents: Workflow.string({
    label: 'Template Components',
    description: 'JSON array of template component parameters',
    acceptsVariables: true,
  }),

  // sendContacts
  sendContactFormattedName: Workflow.string({
    label: 'Formatted Name',
    description: 'Full contact name as displayed',
    acceptsVariables: true,
  }),
  sendContactFirstName: Workflow.string({
    label: 'First Name',
    acceptsVariables: true,
  }),
  sendContactLastName: Workflow.string({
    label: 'Last Name',
    acceptsVariables: true,
  }),
  sendContactPhone: Workflow.string({
    label: 'Phone Number',
    acceptsVariables: true,
  }),
  sendContactEmail: Workflow.string({
    label: 'Email',
    acceptsVariables: true,
  }),

  // sendLocation
  sendLocationLongitude: Workflow.string({
    label: 'Longitude',
    description: 'Location longitude coordinate',
    acceptsVariables: true,
  }),
  sendLocationLatitude: Workflow.string({
    label: 'Latitude',
    description: 'Location latitude coordinate',
    acceptsVariables: true,
  }),
  sendLocationName: Workflow.string({
    label: 'Location Name',
    acceptsVariables: true,
  }),
  sendLocationAddress: Workflow.string({
    label: 'Address',
    acceptsVariables: true,
  }),
}

const sendMessageOutputs = {
  messageId: Workflow.string({ label: 'Message ID' }),
  recipientWaId: Workflow.string({ label: 'Recipient WhatsApp ID' }),
}

const sendTemplateOutputs = {
  messageId: Workflow.string({ label: 'Message ID' }),
  messageStatus: Workflow.string({ label: 'Message Status' }),
  recipientWaId: Workflow.string({ label: 'Recipient WhatsApp ID' }),
}

export function messageComputeOutputs(operation: string) {
  switch (operation) {
    case 'sendText':
    case 'sendMedia':
    case 'sendContacts':
    case 'sendLocation':
      return sendMessageOutputs
    case 'sendTemplate':
      return sendTemplateOutputs
    default:
      return {}
  }
}
