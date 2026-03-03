// src/blocks/discord/resources/constants.ts

export const RESOURCES = [
  { value: 'channel', label: 'Channel' },
  { value: 'message', label: 'Message' },
  { value: 'member', label: 'Member' },
] as const

export const OPERATIONS = {
  channel: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  message: [
    { value: 'send', label: 'Send' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'react', label: 'React' },
  ],
  member: [
    { value: 'getMany', label: 'Get Many' },
    { value: 'roleAdd', label: 'Add Role' },
    { value: 'roleRemove', label: 'Remove Role' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'create', label: 'Create' },
  { value: 'delete', label: 'Delete' },
  { value: 'get', label: 'Get' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'react', label: 'React' },
  { value: 'roleAdd', label: 'Add Role' },
  { value: 'roleRemove', label: 'Remove Role' },
  { value: 'send', label: 'Send' },
  { value: 'update', label: 'Update' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  channel: ['create', 'delete', 'get', 'getMany', 'update'],
  message: ['send', 'delete', 'get', 'getMany', 'react'],
  member: ['getMany', 'roleAdd', 'roleRemove'],
}
