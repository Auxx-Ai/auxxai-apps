// src/tools/gog-sheets-block-delete-rows-or-columns.tool.server.ts

import { executeSheet } from '../blocks/google-sheets/resources/sheet/sheet-execute.server'

export default async function googleSheetsBlockDeleteRowsOrColumns(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSheet('deleteRowsOrColumns', input)
}
