// src/blocks/google-sheets/resources/sheet/sheet-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { sheetsApiRequest, throwConnectionNotFound } from '../../shared/google-sheets-api'

export async function executeSheet(operation: string, input: any): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value
  const spreadsheetId = input.sheetSpreadsheet
  const sheetName = input.sheetTab

  switch (operation) {
    case 'appendRow': {
      let values: string[][]

      if (input.appendDataMode === 'keyValue') {
        const data = JSON.parse(input.appendKeyValueData)
        const headerRow = await getHeaderRow(token, spreadsheetId, sheetName)
        values = [headerRow.map((col) => (data[col] !== undefined ? String(data[col]) : ''))]
      } else {
        values = [input.appendRawValues.split(',').map((v: string) => v.trim())]
      }

      const result = await sheetsApiRequest(
        token,
        'POST',
        `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append`,
        { values },
        {
          valueInputOption: input.appendCellFormat || 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
        }
      )

      return {
        updatedRange: result.updates?.updatedRange || '',
        updatedRows: String(result.updates?.updatedRows || 0),
      }
    }

    case 'clear': {
      if (input.clearScope === 'wholeSheet') {
        let headerValues: string[][] | undefined

        if (input.clearKeepFirstRow === 'true') {
          const headerResult = await sheetsApiRequest(
            token,
            'GET',
            `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!1:1`
          )
          headerValues = headerResult.values
        }

        const result = await sheetsApiRequest(
          token,
          'POST',
          `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`,
          {}
        )

        if (headerValues?.length) {
          await sheetsApiRequest(
            token,
            'PUT',
            `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!1:1`,
            { values: headerValues },
            { valueInputOption: 'RAW' }
          )
        }

        return { clearedRange: result.clearedRange || sheetName }
      } else {
        const range = `${sheetName}!${input.clearRange}`
        const result = await sheetsApiRequest(
          token,
          'POST',
          `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
          {}
        )
        return { clearedRange: result.clearedRange || range }
      }
    }

    case 'createSheet': {
      const body: any = {
        requests: [
          {
            addSheet: {
              properties: {
                title: input.createSheetTitle,
                hidden: input.createSheetHidden === 'true',
              },
            },
          },
        ],
      }

      if (input.createSheetTabColor) {
        const hex = input.createSheetTabColor.replace('#', '')
        body.requests[0].addSheet.properties.tabColorStyle = {
          rgbColor: {
            red: parseInt(hex.slice(0, 2), 16) / 255,
            green: parseInt(hex.slice(2, 4), 16) / 255,
            blue: parseInt(hex.slice(4, 6), 16) / 255,
          },
        }
      }

      const result = await sheetsApiRequest(
        token,
        'POST',
        `/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        body
      )

      const addedSheet = result.replies?.[0]?.addSheet?.properties
      return {
        sheetId: String(addedSheet?.sheetId || ''),
        title: addedSheet?.title || '',
      }
    }

    case 'deleteSheet': {
      const meta = await sheetsApiRequest(
        token,
        'GET',
        `/v4/spreadsheets/${spreadsheetId}`,
        undefined,
        { fields: 'sheets.properties' }
      )
      const sheetMeta = meta.sheets?.find(
        (s: any) => s.properties?.title === sheetName || String(s.properties?.sheetId) === sheetName
      )
      if (!sheetMeta) throw new Error(`Sheet "${sheetName}" not found`)

      await sheetsApiRequest(token, 'POST', `/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        requests: [{ deleteSheet: { sheetId: sheetMeta.properties.sheetId } }],
      })
      return { success: 'true' }
    }

    case 'deleteRowsOrColumns': {
      const meta = await sheetsApiRequest(
        token,
        'GET',
        `/v4/spreadsheets/${spreadsheetId}`,
        undefined,
        { fields: 'sheets.properties' }
      )
      const sheetMeta = meta.sheets?.find(
        (s: any) => s.properties?.title === sheetName || String(s.properties?.sheetId) === sheetName
      )
      if (!sheetMeta) throw new Error(`Sheet "${sheetName}" not found`)

      const dimension = input.deleteTarget === 'rows' ? 'ROWS' : 'COLUMNS'
      let startIndex: number
      if (input.deleteTarget === 'rows') {
        startIndex = Number(input.deleteStartIndex) - 1 // Convert to 0-based
      } else {
        startIndex = input.deleteStartIndex.toUpperCase().charCodeAt(0) - 65
      }
      const count = Number(input.deleteCount) || 1

      await sheetsApiRequest(token, 'POST', `/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetMeta.properties.sheetId,
                dimension,
                startIndex,
                endIndex: startIndex + count,
              },
            },
          },
        ],
      })
      return { success: 'true' }
    }

    case 'getRows': {
      const range = input.getRange ? `${sheetName}!${input.getRange}` : sheetName

      const qs: Record<string, string> = {}
      if (input.getValueRender) qs.valueRenderOption = input.getValueRender
      if (input.getDateTimeRender) qs.dateTimeRenderOption = input.getDateTimeRender

      const result = await sheetsApiRequest(
        token,
        'GET',
        `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        undefined,
        qs
      )

      const rawRows = result.values || []
      if (rawRows.length === 0) {
        return { rows: '[]', count: '0' }
      }

      const headerIdx = Number(input.getHeaderRow || 1) - 1
      const headers = rawRows[headerIdx] || []
      const dataRows = rawRows.slice(headerIdx + 1)

      let rows = dataRows.map((row: string[], idx: number) => {
        const obj: Record<string, string> = { _rowIndex: String(headerIdx + idx + 2) }
        headers.forEach((h: string, i: number) => {
          obj[h] = row[i] !== undefined ? String(row[i]) : ''
        })
        return obj
      })

      if (input.getFilterColumn && input.getFilterValue !== undefined) {
        rows = rows.filter((r: any) => r[input.getFilterColumn] === input.getFilterValue)
      }

      if (input.getReturnFirstMatch === 'first' && rows.length > 0) {
        rows = [rows[0]]
      }

      return {
        rows: JSON.stringify(rows),
        count: String(rows.length),
      }
    }

    case 'updateRow': {
      const headerIdx = Number(input.updateHeaderRow || 1) - 1

      const result = await sheetsApiRequest(
        token,
        'GET',
        `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`,
        undefined,
        { valueRenderOption: 'UNFORMATTED_VALUE' }
      )

      const allRows = result.values || []
      if (allRows.length <= headerIdx) {
        throw new Error('Sheet has no data or header row not found')
      }

      const headers = allRows[headerIdx]
      const matchColIdx = headers.indexOf(input.updateMatchColumn)
      if (matchColIdx === -1) {
        throw new Error(`Column "${input.updateMatchColumn}" not found in headers`)
      }

      const dataStartIdx = headerIdx + 1
      let matchRowIdx = -1
      for (let i = dataStartIdx; i < allRows.length; i++) {
        if (String(allRows[i][matchColIdx]) === String(input.updateMatchValue)) {
          matchRowIdx = i
          break
        }
      }

      if (matchRowIdx === -1) {
        throw new Error(
          `No row found where "${input.updateMatchColumn}" = "${input.updateMatchValue}"`
        )
      }

      const updateData = JSON.parse(input.updateData)
      const updatedRow = [...(allRows[matchRowIdx] || [])]
      for (const [key, value] of Object.entries(updateData)) {
        const colIdx = headers.indexOf(key)
        if (colIdx !== -1) {
          updatedRow[colIdx] = value
        }
      }

      const rowNumber = matchRowIdx + 1 // 1-based
      const updateRange = `${sheetName}!A${rowNumber}`

      const updateResult = await sheetsApiRequest(
        token,
        'PUT',
        `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}`,
        { values: [updatedRow] },
        { valueInputOption: input.updateCellFormat || 'USER_ENTERED' }
      )

      return {
        updatedRange: updateResult.updatedRange || '',
        updatedRows: String(updateResult.updatedRows || 1),
      }
    }

    default:
      throw new Error(`Unknown sheet operation: ${operation}`)
  }
}

async function getHeaderRow(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  headerRowNum = 1
): Promise<string[]> {
  const result = await sheetsApiRequest(
    token,
    'GET',
    `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!${headerRowNum}:${headerRowNum}`
  )
  return result.values?.[0] || []
}
