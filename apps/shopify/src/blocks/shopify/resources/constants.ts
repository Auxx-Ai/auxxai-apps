// src/blocks/shopify/resources/constants.ts

export const RESOURCES = [
  { value: 'order', label: 'Order' },
  { value: 'product', label: 'Product' },
] as const

export const OPERATIONS = {
  order: [
    { value: 'create', label: 'Create' },
    { value: 'delete', label: 'Delete' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  product: [
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
  order: ['create', 'delete', 'get', 'getMany', 'update'],
  product: ['create', 'delete', 'get', 'getMany', 'update'],
}
