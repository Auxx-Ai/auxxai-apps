// src/blocks/notion/notion-panel.tsx

/**
 * Top-level Notion panel component.
 *
 * Renders the Resource/Operation selector row and conditionally renders
 * the appropriate resource panel.
 *
 * Handles:
 * - Auto-resetting operation when resource changes
 * - Lazy data loading (databases, properties only fetched when needed)
 * - Cascading selectors (properties depend on database selection)
 */

import { useEffect, useCallback } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { notionSchema } from './notion-schema'
import { OPERATIONS } from './resources/constants'
import { DatabasePagePanel } from './resources/database-page/database-page-panel'
import { PagePanel } from './resources/page/page-panel'
import { BlockPanel } from './resources/block/block-panel'
import { DatabasePanel } from './resources/database/database-panel'
import { UserPanel } from './resources/user/user-panel'
import { useNotionData } from './shared/use-notion-data'
import listDatabases from './shared/list-databases.server'
import listDatabaseProperties from './shared/list-database-properties.server'

/** Resolve the current database ID from whichever operation-prefixed field is active. */
function getCurrentDatabaseId(data: any): string | undefined {
  if (!data) return undefined
  const resource = data.resource ?? 'databasePage'
  const operation = data.operation ?? 'create'

  if (resource === 'databasePage') {
    const fieldMap: Record<string, string> = {
      create: 'createDatabaseId',
      getMany: 'getManyDatabaseId',
      update: 'updateDatabaseId',
    }
    const field = fieldMap[operation]
    return field ? data[field] : undefined
  }

  if (resource === 'database' && operation === 'get') {
    return data.getDatabaseId
  }

  return undefined
}

export function NotionPanel() {
  const api = useWorkflow<typeof notionSchema>(notionSchema)
  const { data, updateData, OptionsInput, VarFieldGroup, FieldRow, FieldDivider, Section, ConditionalRender } = api

  const resource = (data?.resource ?? 'databasePage') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  // Resolve current database ID for property loading
  const currentDatabaseId = getCurrentDatabaseId(data)

  // Determine what data needs to be loaded
  const needsDatabases =
    resource === 'databasePage' ||
    (resource === 'database' && operation === 'get')

  const needsProperties =
    resource === 'databasePage' &&
    ['create', 'update', 'getMany'].includes(operation) &&
    !!currentDatabaseId

  // Data fetchers with composite cache keys
  const { data: databases, loading: databasesLoading } = useNotionData(
    'databases',
    listDatabases,
    { enabled: needsDatabases },
  )

  const fetchProperties = useCallback(
    () => listDatabaseProperties(currentDatabaseId!, { writableOnly: true }),
    [currentDatabaseId],
  )
  const { data: properties, loading: propertiesLoading } = useNotionData(
    `properties:${currentDatabaseId}`,
    fetchProperties,
    { enabled: needsProperties },
  )

  return (
    <WorkflowPanel>
      {/* Resource/Operation selector row */}
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'databasePage'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.databasePage} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'page'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.page} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'block'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.block} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'database'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.database} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'user'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.user} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      {/* Resource-specific panels */}
      <ConditionalRender when={(d) => d.resource === 'databasePage'}>
        <DatabasePagePanel
          api={api}
          databases={databases}
          databasesLoading={databasesLoading}
          properties={properties as any}
          propertiesLoading={propertiesLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'page'}>
        <PagePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'block'}>
        <BlockPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'database'}>
        <DatabasePanel
          api={api}
          databases={databases}
          databasesLoading={databasesLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'user'}>
        <UserPanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
