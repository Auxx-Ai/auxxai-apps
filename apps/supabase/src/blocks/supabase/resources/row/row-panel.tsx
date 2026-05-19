// src/blocks/supabase/resources/row/row-panel.tsx

/**
 * Row resource panel UI.
 * Renders operation-specific inputs for Create, Delete, Get, Get Many, Update.
 *
 * Filter Type modes:
 *   - manual: render the structured ArrayInput with column/condition/value
 *   - string: render a raw PostgREST filter input
 *   - none (Get Many only): no filter UI
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { supabaseSchema } from '../../supabase-schema'

type SelectOption = { label: string; value: string }

interface RowPanelProps {
  api: UseWorkflowApi<typeof supabaseSchema>
  tables: SelectOption[]
  tablesLoading: boolean
  columns: SelectOption[]
  columnsLoading: boolean
}

export function RowPanel({ api, tables, tablesLoading, columns, columnsLoading }: RowPanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    OptionsInput,
    ArrayInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  const loadingTables = tablesLoading ? [{ label: 'Loading tables...', value: '' }] : tables
  const loadingColumns = columnsLoading ? [{ label: 'Loading columns...', value: '' }] : columns

  return (
    <>
      {/* --- Row: Create --- */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="createTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Fields">
          <ArrayInput name="createFields" addLabel="Add Field">
            <VarFieldGroup>
              <VarField>
                <OptionsInput name="fieldName" options={loadingColumns} />
              </VarField>
              <VarField>
                <StringInput name="fieldValue" />
              </VarField>
            </VarFieldGroup>
          </ArrayInput>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="createCustomSchema" />
            </VarField>
            <ConditionalRender when={(d) => !!d.createCustomSchema}>
              <VarField>
                <StringInput name="createSchema" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Row: Get --- */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getFilterType" />
            </VarField>
            <ConditionalRender when={(d) => d.getFilterType !== 'string'}>
              <VarField>
                <OptionsInput name="getMatchType" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
          <ConditionalRender when={(d) => d.getFilterType !== 'string'}>
            <ArrayInput name="getFilters" addLabel="Add Condition">
              <VarFieldGroup>
                <VarField>
                  <OptionsInput name="column" options={loadingColumns} />
                </VarField>
                <VarField>
                  <OptionsInput name="condition" />
                </VarField>
                <VarField>
                  <StringInput name="value" />
                </VarField>
              </VarFieldGroup>
            </ArrayInput>
          </ConditionalRender>
          <ConditionalRender when={(d) => d.getFilterType === 'string'}>
            <VarFieldGroup>
              <VarField>
                <StringInput name="getFilterString" />
              </VarField>
            </VarFieldGroup>
          </ConditionalRender>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getCustomSchema" />
            </VarField>
            <ConditionalRender when={(d) => !!d.getCustomSchema}>
              <VarField>
                <StringInput name="getSchema" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Row: Get Many --- */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filter" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyFilterType" />
            </VarField>
            <ConditionalRender when={(d) => d.getManyFilterType === 'manual'}>
              <VarField>
                <OptionsInput name="getManyMatchType" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
          <ConditionalRender when={(d) => d.getManyFilterType === 'manual'}>
            <ArrayInput name="getManyFilters" addLabel="Add Condition">
              <VarFieldGroup>
                <VarField>
                  <OptionsInput name="column" options={loadingColumns} />
                </VarField>
                <VarField>
                  <OptionsInput name="condition" />
                </VarField>
                <VarField>
                  <StringInput name="value" />
                </VarField>
              </VarFieldGroup>
            </ArrayInput>
          </ConditionalRender>
          <ConditionalRender when={(d) => d.getManyFilterType === 'string'}>
            <VarFieldGroup>
              <VarField>
                <StringInput name="getManyFilterString" />
              </VarField>
            </VarFieldGroup>
          </ConditionalRender>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyReturnAll}>
              <VarField>
                <NumberInput name="getManyLimit" />
              </VarField>
            </ConditionalRender>
            <VarField>
              <BooleanInput name="getManyCustomSchema" />
            </VarField>
            <ConditionalRender when={(d) => !!d.getManyCustomSchema}>
              <VarField>
                <StringInput name="getManySchema" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Row: Update --- */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="updateTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="updateFilterType" />
            </VarField>
            <ConditionalRender when={(d) => d.updateFilterType !== 'string'}>
              <VarField>
                <OptionsInput name="updateMatchType" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
          <ConditionalRender when={(d) => d.updateFilterType !== 'string'}>
            <ArrayInput name="updateFilters" addLabel="Add Condition">
              <VarFieldGroup>
                <VarField>
                  <OptionsInput name="column" options={loadingColumns} />
                </VarField>
                <VarField>
                  <OptionsInput name="condition" />
                </VarField>
                <VarField>
                  <StringInput name="value" />
                </VarField>
              </VarFieldGroup>
            </ArrayInput>
          </ConditionalRender>
          <ConditionalRender when={(d) => d.updateFilterType === 'string'}>
            <VarFieldGroup>
              <VarField>
                <StringInput name="updateFilterString" />
              </VarField>
            </VarFieldGroup>
          </ConditionalRender>
        </Section>
        <Section title="Fields">
          <ArrayInput name="updateFields" addLabel="Add Field">
            <VarFieldGroup>
              <VarField>
                <OptionsInput name="fieldName" options={loadingColumns} />
              </VarField>
              <VarField>
                <StringInput name="fieldValue" />
              </VarField>
            </VarFieldGroup>
          </ArrayInput>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="updateCustomSchema" />
            </VarField>
            <ConditionalRender when={(d) => !!d.updateCustomSchema}>
              <VarField>
                <StringInput name="updateSchema" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* --- Row: Delete --- */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Table">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="deleteTable" options={loadingTables} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filter">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="deleteFilterType" />
            </VarField>
            <ConditionalRender when={(d) => d.deleteFilterType !== 'string'}>
              <VarField>
                <OptionsInput name="deleteMatchType" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
          <ConditionalRender when={(d) => d.deleteFilterType !== 'string'}>
            <ArrayInput name="deleteFilters" addLabel="Add Condition">
              <VarFieldGroup>
                <VarField>
                  <OptionsInput name="column" options={loadingColumns} />
                </VarField>
                <VarField>
                  <OptionsInput name="condition" />
                </VarField>
                <VarField>
                  <StringInput name="value" />
                </VarField>
              </VarFieldGroup>
            </ArrayInput>
          </ConditionalRender>
          <ConditionalRender when={(d) => d.deleteFilterType === 'string'}>
            <VarFieldGroup>
              <VarField>
                <StringInput name="deleteFilterString" />
              </VarField>
            </VarFieldGroup>
          </ConditionalRender>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="deleteCustomSchema" />
            </VarField>
            <ConditionalRender when={(d) => !!d.deleteCustomSchema}>
              <VarField>
                <StringInput name="deleteSchema" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
