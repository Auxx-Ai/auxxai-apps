// src/blocks/notion/resources/database/database-panel.tsx

/**
 * Database resource panel UI.
 * Renders operation-specific inputs for Get, Get Many, Search.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { notionSchema } from '../../notion-schema'

type SelectOption = { label: string; value: string }

interface DatabasePanelProps {
  api: UseWorkflowApi<typeof notionSchema>
  databases: SelectOption[]
  databasesLoading: boolean
}

export function DatabasePanel({ api, databases, databasesLoading }: DatabasePanelProps) {
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

  const loadingDatabases = databasesLoading
    ? [{ label: 'Loading databases...', value: '' }]
    : databases

  return (
    <>
      {/* Database: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Database">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getDatabaseId" options={loadingDatabases} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Database: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Options">
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="getManyDbReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.getManyDbReturnAll}>
              <VarField>
                <NumberInput name="getManyDbLimit" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Database: Search */}
      <ConditionalRender when={(d) => d.operation === 'search'}>
        <Section title="Search">
          <VarFieldGroup>
            <VarField>
              <StringInput name="searchDbText" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="searchDbReturnAll" />
            </VarField>
            <ConditionalRender when={(d) => !d.searchDbReturnAll}>
              <VarField>
                <NumberInput name="searchDbLimit" />
              </VarField>
            </ConditionalRender>
            <VarField>
              <OptionsInput name="searchDbSortDirection" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
