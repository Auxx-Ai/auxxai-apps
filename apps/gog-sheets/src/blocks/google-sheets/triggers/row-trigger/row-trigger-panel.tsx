// src/blocks/google-sheets/triggers/row-trigger/row-trigger-panel.tsx

import { useCallback } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { rowTriggerSchema } from './row-trigger-schema'
import { useSheetsData } from '../../shared/use-sheets-data'
import listSpreadsheets from '../../shared/list-spreadsheets.server'
import listSheets from '../../shared/list-sheets.server'

export function RowTriggerPanel() {
  const api = useWorkflow<typeof rowTriggerSchema>(rowTriggerSchema)
  const { data, OptionsInput, StringInput, VarField, VarFieldGroup, Section } = api

  const { data: spreadsheets, loading: spreadsheetsLoading } = useSheetsData(
    'gog-sheets-spreadsheets',
    listSpreadsheets
  )

  const selectedSpreadsheet = data?.spreadsheetId as string | undefined

  const sheetsFetcher = useCallback(() => listSheets(selectedSpreadsheet!), [selectedSpreadsheet])

  const { data: sheets, loading: sheetsLoading } = useSheetsData(
    `gog-sheets-sheets-${selectedSpreadsheet}`,
    sheetsFetcher,
    { enabled: !!selectedSpreadsheet }
  )

  return (
    <WorkflowPanel>
      <Section title="Source">
        <VarFieldGroup>
          <VarField>
            <OptionsInput
              name={'spreadsheetId'}
              options={
                spreadsheetsLoading
                  ? [{ label: 'Loading spreadsheets...', value: '' }]
                  : spreadsheets
              }
            />
          </VarField>
          <VarField>
            <OptionsInput
              name={'sheetName'}
              options={sheetsLoading ? [{ label: 'Loading sheets...', value: '' }] : sheets}
            />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Trigger">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name={'triggerOn'} />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Options" collapsible>
        <VarFieldGroup>
          <VarField>
            <StringInput name={'headerRow'} />
          </VarField>
          <VarField>
            <StringInput name={'columnsToWatch'} />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
