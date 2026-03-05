// src/blocks/google-sheets/resources/spreadsheet/spreadsheet-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { googleSheetsSchema } from '../../google-sheets-schema'

interface SpreadsheetPanelProps {
  api: UseWorkflowApi<typeof googleSheetsSchema>
}

export function SpreadsheetPanel({ api }: SpreadsheetPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Spreadsheet: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Spreadsheet">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createTitle'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createLocale'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createAutoRecalc'} />
            </VarField>
            <VarField>
              <StringInput name={'createSheetTitles'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Spreadsheet: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Spreadsheet">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'deleteSpreadsheetId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
