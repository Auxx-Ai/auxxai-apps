// src/blocks/google-sheets/shared/list-sheets.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { sheetsApiRequest, throwConnectionNotFound } from './google-sheets-api'

export default async function listSheets(
  spreadsheetId: string
): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  if (!spreadsheetId) return []

  const result = await sheetsApiRequest(
    connection.value,
    'GET',
    `/v4/spreadsheets/${spreadsheetId}`,
    undefined,
    { fields: 'sheets.properties(sheetId,title)' }
  )

  return ((result as any).sheets || []).map((s: any) => ({
    value: s.properties?.title || '',
    label: s.properties?.title || `Sheet ${s.properties?.sheetId}`,
  }))
}
