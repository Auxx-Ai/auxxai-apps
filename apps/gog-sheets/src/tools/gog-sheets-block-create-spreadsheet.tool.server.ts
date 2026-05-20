// src/tools/gog-sheets-block-create-spreadsheet.tool.server.ts

import { executeSpreadsheet } from '../blocks/google-sheets/resources/spreadsheet/spreadsheet-execute.server'

export default async function googleSheetsBlockCreateSpreadsheet(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeSpreadsheet('create', input)
}
