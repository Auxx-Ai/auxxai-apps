// src/tools/block/shared.ts

/**
 * Shared helpers for the internal Airtable block-op tools.
 */

import { BlockValidationError } from '@auxx/sdk/shared'

export function parseFieldsJson(fieldsStr: string, fieldName: string): Record<string, string> {
  if (!fieldsStr?.trim()) return {}
  try {
    const parsed = JSON.parse(fieldsStr)
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object')
    }
    return parsed
  } catch {
    throw new BlockValidationError([
      {
        field: fieldName,
        message:
          'Fields must be a valid JSON object. Example: {"Name": "John", "Email": "john@acme.com"}',
      },
    ])
  }
}
