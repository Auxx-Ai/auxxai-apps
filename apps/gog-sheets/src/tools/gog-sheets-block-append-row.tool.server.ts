// src/tools/gog-sheets-block-append-row.tool.server.ts

import { executeSheet } from '../blocks/google-sheets/resources/sheet/sheet-execute.server'

export default async function googleSheetsBlockAppendRow(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSheet('appendRow', input)
}
