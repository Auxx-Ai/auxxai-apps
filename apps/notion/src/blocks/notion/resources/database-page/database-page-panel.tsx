// src/blocks/notion/resources/database-page/database-page-panel.tsx

/**
 * Database Page resource panel UI.
 * Renders operation-specific inputs for Create, Get, Get Many, Update.
 */

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { notionSchema } from '../../notion-schema'
import type { DatabaseProperty } from '../../shared/list-database-properties.server'
import { FILTER_CONDITIONS } from '../constants'

type SelectOption = { label: string; value: string }

interface DatabasePagePanelProps {
  api: UseWorkflowApi<typeof notionSchema>
  databases: SelectOption[]
  databasesLoading: boolean
  properties: DatabaseProperty[]
  propertiesLoading: boolean
}

export function DatabasePagePanel({
  api,
  databases,
  databasesLoading,
  properties,
  propertiesLoading,
}: DatabasePagePanelProps) {
  const {
    data,
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

  const loadingDatabases = databasesLoading
    ? [{ label: 'Loading databases...', value: '' }]
    : databases
  const loadingProperties = propertiesLoading
    ? [{ label: 'Loading properties...', value: '' }]
    : properties

  // Get filter conditions based on selected property type
  const filterPropertyName = data?.getManyFilterProperty
  const filterPropertyType = properties.find((p) => p.value === filterPropertyName)?.type ?? ''
  const filterConditions = FILTER_CONDITIONS[filterPropertyType] ?? []

  return (
    <>
      {/* Database Page: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Database">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="createDatabaseId" options={loadingDatabases} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Title">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createTitle" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Properties">
          <VarFieldGroup>
            <VarField>
              <ArrayInput name="createProperties" propertyOptions={loadingProperties} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Content" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createContent" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Database Page: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Page">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getPageId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Database Page: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Database">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyDatabaseId" options={loadingDatabases} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filter" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyFilterType" />
            </VarField>
            <ConditionalRender when={(d) => d.getManyFilterType === 'simple'}>
              <VarField>
                <OptionsInput name="getManyFilterProperty" options={loadingProperties} />
              </VarField>
              <VarField>
                <OptionsInput name="getManyFilterCondition" options={filterConditions} />
              </VarField>
              <VarField>
                <StringInput name="getManyFilterValue" />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.getManyFilterType === 'json'}>
              <VarField>
                <StringInput name="getManyFilterJson" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
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
              <OptionsInput name="getManySortProperty" options={loadingProperties} />
            </VarField>
            <VarField>
              <OptionsInput name="getManySortDirection" />
            </VarField>
            <VarField>
              <OptionsInput name="getManySortTimestamp" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Database Page: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Page">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updatePageId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Database">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="updateDatabaseId" options={loadingDatabases} />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Properties">
          <VarFieldGroup>
            <VarField>
              <ArrayInput name="updateProperties" propertyOptions={loadingProperties} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
