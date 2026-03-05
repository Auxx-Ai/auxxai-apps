// src/blocks/google-sheets/google-sheets-panel.tsx

import { useEffect, useCallback } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { googleSheetsSchema } from './google-sheets-schema'
import { OPERATIONS } from './resources/constants'
import { SpreadsheetPanel } from './resources/spreadsheet/spreadsheet-panel'
import { SheetPanel } from './resources/sheet/sheet-panel'
import { useSheetsData } from './shared/use-sheets-data'
import listSpreadsheets from './shared/list-spreadsheets.server'
import listSheets from './shared/list-sheets.server'

export function GoogleSheetsPanel() {
  const api = useWorkflow<typeof googleSheetsSchema>(googleSheetsSchema)

  const {
    data,
    updateData,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'sheet') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'getRows'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  // Spreadsheets are needed for all sheet operations
  const needsSpreadsheets = resource === 'sheet'

  const { data: spreadsheets, loading: spreadsheetsLoading } = useSheetsData(
    'gog-sheets-spreadsheets',
    listSpreadsheets,
    { enabled: needsSpreadsheets }
  )

  // Sheets are needed when a spreadsheet is selected (for most sheet operations)
  const selectedSpreadsheet = data?.sheetSpreadsheet as string | undefined
  const needsSheets = resource === 'sheet' && !!selectedSpreadsheet

  const sheetsFetcher = useCallback(() => listSheets(selectedSpreadsheet!), [selectedSpreadsheet])

  const { data: sheets, loading: sheetsLoading } = useSheetsData(
    `gog-sheets-sheets-${selectedSpreadsheet}`,
    sheetsFetcher,
    { enabled: needsSheets }
  )

  return (
    <WorkflowPanel>
      {/* Resource/Operation selector row */}
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'spreadsheet'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.spreadsheet} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'sheet'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.sheet} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      {/* Resource-specific panels */}
      <ConditionalRender when={(d) => d.resource === 'spreadsheet'}>
        <SpreadsheetPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'sheet'}>
        <SheetPanel
          api={api}
          spreadsheets={spreadsheets}
          spreadsheetsLoading={spreadsheetsLoading}
          sheets={sheets}
          sheetsLoading={sheetsLoading}
        />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
