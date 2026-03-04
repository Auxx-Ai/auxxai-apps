// src/blocks/twilio/resources/constants.ts

export const RESOURCES = [
  { value: 'sms', label: 'SMS' },
  { value: 'call', label: 'Call' },
] as const

export const OPERATIONS = {
  sms: [{ value: 'send', label: 'Send' }],
  call: [{ value: 'make', label: 'Make' }],
} as const

export const ALL_OPERATIONS = [
  { value: 'send', label: 'Send' },
  { value: 'make', label: 'Make' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  sms: ['send'],
  call: ['make'],
}
