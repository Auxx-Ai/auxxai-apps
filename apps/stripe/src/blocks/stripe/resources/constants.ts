export const RESOURCES = [
  { value: 'balance', label: 'Balance' },
  { value: 'charge', label: 'Charge' },
  { value: 'coupon', label: 'Coupon' },
  { value: 'customer', label: 'Customer' },
  { value: 'customerCard', label: 'Customer Card' },
  { value: 'source', label: 'Source' },
  { value: 'token', label: 'Token' },
] as const

export const OPERATIONS = {
  balance: [{ value: 'get', label: 'Get' }],
  charge: [
    { value: 'create', label: 'Create' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  coupon: [
    { value: 'create', label: 'Create' },
    { value: 'getMany', label: 'Get Many' },
  ],
  customer: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  customerCard: [
    { value: 'add', label: 'Add' },
    { value: 'get', label: 'Get' },
    { value: 'remove', label: 'Remove' },
  ],
  source: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
  ],
  token: [{ value: 'create', label: 'Create' }],
} as const

export const ALL_OPERATIONS = [
  { value: 'add', label: 'Add' },
  { value: 'create', label: 'Create' },
  { value: 'delete', label: 'Delete' },
  { value: 'get', label: 'Get' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'remove', label: 'Remove' },
  { value: 'update', label: 'Update' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  balance: ['get'],
  charge: ['create', 'get', 'getMany', 'update'],
  coupon: ['create', 'getMany'],
  customer: ['create', 'delete', 'get', 'getMany', 'update'],
  customerCard: ['add', 'get', 'remove'],
  source: ['create', 'delete', 'get'],
  token: ['create'],
}
