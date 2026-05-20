// src/tools/gog-sheets-block-delete-sheet.tool.server.ts

import { executeSheet } from '../blocks/google-sheets/resources/sheet/sheet-execute.server'

export default async function googleSheetsBlockDeleteSheet(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSheet('deleteSheet', input)
}
