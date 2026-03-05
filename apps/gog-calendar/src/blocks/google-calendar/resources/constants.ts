// src/blocks/google-calendar/resources/constants.ts

export const RESOURCES = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'event', label: 'Event' },
] as const

export const OPERATIONS = {
  calendar: [{ value: 'checkAvailability', label: 'Check Availability' }],
  event: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'checkAvailability', label: 'Check Availability' },
  { value: 'create', label: 'Create' },
  { value: 'delete', label: 'Delete' },
  { value: 'get', label: 'Get' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'update', label: 'Update' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  calendar: ['checkAvailability'],
  event: ['create', 'delete', 'get', 'getMany', 'update'],
}
