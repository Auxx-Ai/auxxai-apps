// src/blocks/whatsapp/triggers/message-received/message-received-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const messageReceivedSchema = {
  inputs: {
    eventTypes: Workflow.select({
      label: 'Event Types',
      multi: true,
      options: [
        { value: 'message', label: 'Messages' },
        { value: 'status', label: 'Status Updates' },
      ],
      default: ['message'],
    }),
    filterStatuses: Workflow.select({
      label: 'Status Filter',
      description: 'Filter by specific status type',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'sent', label: 'Sent' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'read', label: 'Read' },
        { value: 'failed', label: 'Failed' },
        { value: 'deleted', label: 'Deleted' },
      ],
      default: 'all',
    }),
  },
  outputs: {
    eventType: Workflow.string({
      label: 'Event Type',
      description: '"message" or "status"',
    }),
    messageId: Workflow.string({ label: 'Message ID' }),
    from: Workflow.string({ label: 'From', description: 'Sender phone number' }),
    to: Workflow.string({ label: 'To', description: 'Recipient phone number ID' }),
    timestamp: Workflow.string({ label: 'Timestamp' }),
    messageType: Workflow.string({
      label: 'Message Type',
      description: 'text, image, video, audio, document, location, contacts, sticker, reaction',
    }),
    messageBody: Workflow.string({
      label: 'Message Body',
      description: 'Text content or media caption',
    }),
    mediaId: Workflow.string({ label: 'Media ID', description: 'For media messages' }),
    mediaUrl: Workflow.string({ label: 'Media URL', description: 'For media messages' }),
    mimeType: Workflow.string({ label: 'MIME Type', description: 'For media messages' }),
    statusType: Workflow.string({
      label: 'Status Type',
      description: 'For status events: sent, delivered, read, failed, deleted',
    }),
    contactName: Workflow.string({
      label: 'Contact Name',
      description: "Sender's WhatsApp profile name",
    }),
    raw: Workflow.string({
      label: 'Raw Event',
      description: 'Full raw event JSON',
    }),
  },
} satisfies WorkflowSchema
