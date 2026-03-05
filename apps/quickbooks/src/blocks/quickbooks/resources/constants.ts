export const RESOURCES = [
  { value: 'bill', label: 'Bill' },
  { value: 'customer', label: 'Customer' },
  { value: 'employee', label: 'Employee' },
  { value: 'estimate', label: 'Estimate' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'item', label: 'Item' },
  { value: 'payment', label: 'Payment' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'vendor', label: 'Vendor' },
] as const

export const OPERATIONS = {
  bill: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  customer: [
    { value: 'create', label: 'Create' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  employee: [
    { value: 'create', label: 'Create' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  estimate: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'send', label: 'Send' },
    { value: 'update', label: 'Update' },
  ],
  invoice: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'send', label: 'Send' },
    { value: 'update', label: 'Update' },
    { value: 'void', label: 'Void' },
  ],
  item: [
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
  ],
  payment: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'send', label: 'Send' },
    { value: 'update', label: 'Update' },
    { value: 'void', label: 'Void' },
  ],
  purchase: [
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
  ],
  transaction: [{ value: 'getReport', label: 'Get Report' }],
  vendor: [
    { value: 'create', label: 'Create' },
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
  { value: 'getReport', label: 'Get Report' },
  { value: 'send', label: 'Send' },
  { value: 'update', label: 'Update' },
  { value: 'void', label: 'Void' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  bill: ['create', 'delete', 'get', 'getMany', 'update'],
  customer: ['create', 'get', 'getMany', 'update'],
  employee: ['create', 'get', 'getMany', 'update'],
  estimate: ['create', 'delete', 'get', 'getMany', 'send', 'update'],
  invoice: ['create', 'delete', 'get', 'getMany', 'send', 'update', 'void'],
  item: ['get', 'getMany'],
  payment: ['create', 'delete', 'get', 'getMany', 'send', 'update', 'void'],
  purchase: ['get', 'getMany'],
  transaction: ['getReport'],
  vendor: ['create', 'get', 'getMany', 'update'],
}
