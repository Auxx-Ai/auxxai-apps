// src/blocks/whatsapp/resources/constants.ts

export const RESOURCES = [
  { value: 'message', label: 'Message' },
  { value: 'media', label: 'Media' },
] as const

export const OPERATIONS = {
  message: [
    { value: 'sendText', label: 'Send Text Message' },
    { value: 'sendMedia', label: 'Send Media Message' },
    { value: 'sendTemplate', label: 'Send Template Message' },
    { value: 'sendContacts', label: 'Send Contact Card' },
    { value: 'sendLocation', label: 'Send Location' },
  ],
  media: [
    { value: 'upload', label: 'Upload Media' },
    { value: 'getUrl', label: 'Get Media URL' },
    { value: 'delete', label: 'Delete Media' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'sendText', label: 'Send Text Message' },
  { value: 'sendMedia', label: 'Send Media Message' },
  { value: 'sendTemplate', label: 'Send Template Message' },
  { value: 'sendContacts', label: 'Send Contact Card' },
  { value: 'sendLocation', label: 'Send Location' },
  { value: 'upload', label: 'Upload Media' },
  { value: 'getUrl', label: 'Get Media URL' },
  { value: 'delete', label: 'Delete Media' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  message: ['sendText', 'sendMedia', 'sendTemplate', 'sendContacts', 'sendLocation'],
  media: ['upload', 'getUrl', 'delete'],
}
