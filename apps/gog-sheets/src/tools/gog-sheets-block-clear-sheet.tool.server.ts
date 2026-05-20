// src/tools/gog-sheets-block-clear-sheet.tool.server.ts

import { executeSheet } from '../blocks/google-sheets/resources/sheet/sheet-execute.server'

export default async function googleSheetsBlockClearSheet(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSheet('clear', input)
}
