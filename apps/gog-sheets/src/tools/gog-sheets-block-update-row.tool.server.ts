// src/tools/gog-sheets-block-update-row.tool.server.ts

import { executeSheet } from '../blocks/google-sheets/resources/sheet/sheet-execute.server'

export default async function googleSheetsBlockUpdateRow(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSheet('updateRow', input)
}
