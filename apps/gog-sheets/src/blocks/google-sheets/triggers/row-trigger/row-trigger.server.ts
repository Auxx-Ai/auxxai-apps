// src/blocks/google-sheets/triggers/row-trigger/row-trigger.server.ts

import type { PollingState, PollingExecuteResult } from '@auxx/sdk/server'
import { sheetsApiRequest } from '../../shared/google-sheets-api'

export default async function rowTriggerExecute(
  input: Record<string, unknown>,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const { state, connection } = polling
  if (!connection?.value) return { events: [], state }

  const token = connection.value
  const spreadsheetId = input.spreadsheetId as string
  const sheetName = input.sheetName as string
  const rawTriggerOn = input.triggerOn
  const triggerOn: string[] = Array.isArray(rawTriggerOn)
    ? rawTriggerOn
    : rawTriggerOn === 'anyUpdate'
      ? ['rowAdded', 'rowUpdated']
      : [rawTriggerOn as string]
  const headerRowNum = Number(input.headerRow || 1)
  const columnsToWatch = input.columnsToWatch
    ? (input.columnsToWatch as string)
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : []

  // Read current sheet data
  const currentResult = await sheetsApiRequest(
    token,
    'GET',
    `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`,
    undefined,
    { valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'SERIAL_NUMBER' }
  )

  const currentRows = (currentResult as any).values || []
  const headerIdx = headerRowNum - 1
  const headers = currentRows[headerIdx] || []
  const currentDataRows = currentRows.slice(headerIdx + 1)

  const previousDataRows = (state.previousDataRows as string[][] | undefined) || []
  const events: Record<string, string>[] = []

  if (triggerOn.includes('rowAdded')) {
    const newRows = currentDataRows.slice(previousDataRows.length)
    for (let i = 0; i < newRows.length; i++) {
      const rowIdx = previousDataRows.length + headerIdx + 1 + i + 1 // 1-based
      events.push({
        rowIndex: String(rowIdx),
        rowData: JSON.stringify(rowToObject(headers, newRows[i])),
        changeType: 'added',
      })
    }
  }

  if (triggerOn.includes('rowUpdated')) {
    const overlapCount = Math.min(previousDataRows.length, currentDataRows.length)
    for (let i = 0; i < overlapCount; i++) {
      const prev = previousDataRows[i]
      const curr = currentDataRows[i]

      let changed = false
      if (columnsToWatch.length > 0) {
        for (const colName of columnsToWatch) {
          const colIdx = headers.indexOf(colName)
          if (colIdx !== -1 && String(prev?.[colIdx] ?? '') !== String(curr?.[colIdx] ?? '')) {
            changed = true
            break
          }
        }
      } else {
        const maxLen = Math.max(prev?.length || 0, curr?.length || 0)
        for (let j = 0; j < maxLen; j++) {
          if (String(prev?.[j] ?? '') !== String(curr?.[j] ?? '')) {
            changed = true
            break
          }
        }
      }

      if (changed) {
        const rowIdx = headerIdx + 1 + i + 1 // 1-based
        events.push({
          rowIndex: String(rowIdx),
          rowData: JSON.stringify(rowToObject(headers, curr)),
          changeType: 'updated',
        })
      }
    }
  }

  return {
    events,
    state: {
      ...state,
      previousDataRows: currentDataRows,
    },
  }
}

function rowToObject(headers: string[], row: any[]): Record<string, string> {
  const obj: Record<string, string> = {}
  headers.forEach((h: string, i: number) => {
    obj[h] = row?.[i] !== undefined ? String(row[i]) : ''
  })
  return obj
}
