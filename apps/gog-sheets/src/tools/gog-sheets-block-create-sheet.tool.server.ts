// src/tools/gog-sheets-block-create-sheet.tool.server.ts

import { executeSheet } from '../blocks/google-sheets/resources/sheet/sheet-execute.server'

export default async function googleSheetsBlockCreateSheet(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSheet('createSheet', input)
}
