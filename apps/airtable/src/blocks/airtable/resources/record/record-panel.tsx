// src/blocks/airtable/resources/record/record-panel.tsx

/**
 * Record resource panel UI.
 * Renders operation-specific inputs for all 6 record operations.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { airtableSchema } from '../../airtable-schema'

type SelectOption = { label: string; value: string }

interface RecordPanelProps {
  api: UseWorkflowApi<typeof airtableSchema>
  bases: SelectOption[]
  basesLoading: boolean
  tables: SelectOption[]
  tablesLoading: boolean
  fields: SelectOption[]
  fieldsLoading: boolean
  views: SelectOption[]
  viewsLoading: boolean
}

export function RecordPanel({
  api,
  bases,
  basesLoading,
  tables,
  tablesLoading,
  fields,
  fieldsLoading,
  views,
  viewsLoading,
}: RecordPanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const loadingBases = basesLoading ? [{ label: 'Loading bases...', value: '' }] : bases
  const loadingTables = tablesLoading ? [{ label: 'Loading tables...', value: '' }] : tables
  const loadingFields = fieldsLoading ? [{ label: 'Loading fields...', value: '' }] : fields
  const loadingViews = viewsLoading ? [{ label: 'Loading views...', value: '' }] : views

  return (
    <>
      {/* Record: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Base & Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="createBase" options={loadingBases} />
            </VarField>
            <VarField>
              <OptionsInput name="createTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="createTypecast" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Record: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Base & Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="deleteBase" options={loadingBases} />
            </VarField>
            <VarField>
              <OptionsInput name="deleteTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Record">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteRecordId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Record: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Base & Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getBase" options={loadingBases} />
            </VarField>
            <VarField>
              <OptionsInput name="getTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Record">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getRecordId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Record: Search */}
      <ConditionalRender when={(d) => d.operation === 'search'}>
        <Section title="Base & Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="searchBase" options={loadingBases} />
            </VarField>
            <VarField>
              <OptionsInput name="searchTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <StringInput name="searchFilterFormula" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="searchReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.searchReturnAll}>
              <VarField>
                <NumberInput name="searchLimit" />
              </VarField>
            </ConditionalRender>
            <VarField>
              <OptionsInput name="searchSortField" options={loadingFields} />
            </VarField>
            <VarField>
              <OptionsInput name="searchSortDirection" />
            </VarField>
            <VarField>
              <OptionsInput name="searchView" options={loadingViews} />
            </VarField>
            <VarField>
              <StringInput name="searchOutputFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Record: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Base & Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="updateBase" options={loadingBases} />
            </VarField>
            <VarField>
              <OptionsInput name="updateTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Record">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateRecordId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="updateTypecast" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Record: Upsert */}
      <ConditionalRender when={(d) => d.operation === 'upsert'}>
        <Section title="Base & Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="upsertBase" options={loadingBases} />
            </VarField>
            <VarField>
              <OptionsInput name="upsertTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Match On">
          <VarFieldGroup>
            <VarField>
              <StringInput name="upsertMergeFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="upsertFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="upsertTypecast" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
