// src/blocks/google-sheets/resources/sheet/sheet-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { googleSheetsSchema } from '../../google-sheets-schema'

type SelectOption = { label: string; value: string }

interface SheetPanelProps {
  api: UseWorkflowApi<typeof googleSheetsSchema>
  spreadsheets: SelectOption[]
  spreadsheetsLoading: boolean
  sheets: SelectOption[]
  sheetsLoading: boolean
}

export function SheetPanel({
  api,
  spreadsheets,
  spreadsheetsLoading,
  sheets,
  sheetsLoading,
}: SheetPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  const spreadsheetOptions = spreadsheetsLoading
    ? [{ label: 'Loading spreadsheets...', value: '' }]
    : spreadsheets

  const sheetOptions = sheetsLoading ? [{ label: 'Loading sheets...', value: '' }] : sheets

  return (
    <>
      {/* Target: Spreadsheet + Sheet selectors (used by most operations) */}
      <ConditionalRender when={(d) => d.operation !== 'createSheet'}>
        <Section title="Target">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'sheetSpreadsheet'} options={spreadsheetOptions} />
            </VarField>
            <VarField>
              <OptionsInput name={'sheetTab'} options={sheetOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Target: Spreadsheet only (for createSheet) */}
      <ConditionalRender when={(d) => d.operation === 'createSheet'}>
        <Section title="Target">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'sheetSpreadsheet'} options={spreadsheetOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Sheet: Append Row */}
      <ConditionalRender when={(d) => d.operation === 'appendRow'}>
        <Section title="Row Data">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'appendDataMode'} />
            </VarField>
            <ConditionalRender when={(d) => d.appendDataMode === 'keyValue'}>
              <VarField>
                <StringInput name={'appendKeyValueData'} />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.appendDataMode === 'raw'}>
              <VarField>
                <StringInput name={'appendRawValues'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'appendCellFormat'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Sheet: Clear */}
      <ConditionalRender when={(d) => d.operation === 'clear'}>
        <Section title="Clear">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'clearScope'} />
            </VarField>
            <ConditionalRender when={(d) => d.clearScope === 'wholeSheet'}>
              <VarField>
                <OptionsInput name={'clearKeepFirstRow'} />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.clearScope === 'specificRange'}>
              <VarField>
                <StringInput name={'clearRange'} />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Sheet: Create Sheet */}
      <ConditionalRender when={(d) => d.operation === 'createSheet'}>
        <Section title="New Sheet">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createSheetTitle'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'createSheetHidden'} />
            </VarField>
            <VarField>
              <StringInput name={'createSheetTabColor'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Sheet: Delete Sheet — no extra inputs needed, uses Target selectors */}

      {/* Sheet: Delete Rows or Columns */}
      <ConditionalRender when={(d) => d.operation === 'deleteRowsOrColumns'}>
        <Section title="Delete">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'deleteTarget'} />
            </VarField>
            <VarField>
              <StringInput name={'deleteStartIndex'} />
            </VarField>
            <VarField>
              <StringInput name={'deleteCount'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Sheet: Get Row(s) */}
      <ConditionalRender when={(d) => d.operation === 'getRows'}>
        <Section title="Read">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getRange'} />
            </VarField>
            <VarField>
              <StringInput name={'getHeaderRow'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filter" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getFilterColumn'} />
            </VarField>
            <VarField>
              <StringInput name={'getFilterValue'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getReturnFirstMatch'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getValueRender'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getDateTimeRender'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Sheet: Update Row */}
      <ConditionalRender when={(d) => d.operation === 'updateRow'}>
        <Section title="Match">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateMatchColumn'} />
            </VarField>
            <VarField>
              <StringInput name={'updateMatchValue'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateData'} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'updateCellFormat'} />
            </VarField>
            <VarField>
              <StringInput name={'updateHeaderRow'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
