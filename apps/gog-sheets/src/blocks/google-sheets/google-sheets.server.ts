// src/blocks/google-sheets/google-sheets.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { executeSpreadsheet } from './resources/spreadsheet/spreadsheet-execute.server'
import { executeSheet } from './resources/sheet/sheet-execute.server'

export default async function googleSheetsExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'spreadsheet':
      return executeSpreadsheet(operation, input)
    case 'sheet':
      return executeSheet(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
