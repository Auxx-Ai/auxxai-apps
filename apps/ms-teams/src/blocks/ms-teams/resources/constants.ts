export const RESOURCES = [
  { value: 'channel', label: 'Channel' },
  { value: 'channelMessage', label: 'Channel Message' },
  { value: 'chatMessage', label: 'Chat Message' },
  { value: 'task', label: 'Task' },
] as const

export const OPERATIONS = {
  channel: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  channelMessage: [
    { value: 'create', label: 'Create' },
    { value: 'getMany', label: 'Get Many' },
  ],
  chatMessage: [
    { value: 'create', label: 'Create' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
  ],
  task: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'create', label: 'Create' },
  { value: 'delete', label: 'Delete' },
  { value: 'get', label: 'Get' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'update', label: 'Update' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  channel: ['create', 'delete', 'get', 'getMany', 'update'],
  channelMessage: ['create', 'getMany'],
  chatMessage: ['create', 'get', 'getMany'],
  task: ['create', 'delete', 'get', 'getMany', 'update'],
}
