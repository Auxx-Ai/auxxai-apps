// src/tools/gog-sheets-block-delete-spreadsheet.tool.server.ts

import { executeSpreadsheet } from '../blocks/google-sheets/resources/spreadsheet/spreadsheet-execute.server'

export default async function googleSheetsBlockDeleteSpreadsheet(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSpreadsheet('delete', input)
}
