// src/blocks/google-sheets/shared/list-spreadsheets.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { driveApiRequest, throwConnectionNotFound } from './google-sheets-api'

export default async function listSpreadsheets(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const result = await driveApiRequest(connection.value, 'GET', '/drive/v3/files', undefined, {
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id,name)',
    orderBy: 'modifiedTime desc',
    pageSize: 100,
  })

  return ((result as any).files || [])
    .map((f: any) => ({ value: f.id, label: f.name || f.id }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label))
}
