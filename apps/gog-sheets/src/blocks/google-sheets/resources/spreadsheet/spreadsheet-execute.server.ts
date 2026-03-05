// src/blocks/google-sheets/resources/spreadsheet/spreadsheet-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import {
  sheetsApiRequest,
  driveApiRequest,
  throwConnectionNotFound,
} from '../../shared/google-sheets-api'

export async function executeSpreadsheet(
  operation: string,
  input: any
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'create': {
      const body: any = {
        properties: {
          title: input.createTitle || 'Untitled Spreadsheet',
        },
      }

      if (input.createLocale) body.properties.locale = input.createLocale
      if (input.createAutoRecalc) body.properties.autoRecalc = input.createAutoRecalc

      if (input.createSheetTitles) {
        body.sheets = input.createSheetTitles
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
          .map((title: string) => ({
            properties: { title },
          }))
      }

      const result = await sheetsApiRequest(token, 'POST', '/v4/spreadsheets', body)

      return {
        spreadsheetId: result.spreadsheetId || '',
        spreadsheetUrl: result.spreadsheetUrl || '',
        title: result.properties?.title || '',
      }
    }

    case 'delete': {
      await driveApiRequest(token, 'DELETE', `/drive/v3/files/${input.deleteSpreadsheetId}`)
      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown spreadsheet operation: ${operation}`)
  }
}
