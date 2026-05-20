// src/tools/gog-sheets-block-get-rows.tool.server.ts

import { executeSheet } from '../blocks/google-sheets/resources/sheet/sheet-execute.server'

export default async function googleSheetsBlockGetRows(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSheet('getRows', input)
}
