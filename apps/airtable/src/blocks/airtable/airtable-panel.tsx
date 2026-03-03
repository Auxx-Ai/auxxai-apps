// src/blocks/airtable/airtable-panel.tsx

/**
 * Top-level Airtable panel component.
 *
 * Renders the Resource/Operation selector row and conditionally renders
 * the appropriate resource panel (RecordPanel or BasePanel).
 *
 * Handles:
 * - Auto-resetting operation when resource changes
 * - Lazy data loading (bases, tables, fields, views only fetched when needed)
 * - Cascading selectors (tables depend on base, fields/views depend on base+table)
 */

import { useEffect, useCallback } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { airtableSchema } from './airtable-schema'
import { OPERATIONS } from './resources/constants'
import { RecordPanel } from './resources/record/record-panel'
import { BasePanel } from './resources/base/base-panel'
import { useAirtableData } from './shared/use-airtable-data'
import listBases from './shared/list-bases.server'
import listTables from './shared/list-tables.server'
import listFields from './shared/list-fields.server'
import listViews from './shared/list-views.server'

/** Resolve the current base ID from whichever operation-prefixed field is active. */
function getCurrentBase(data: any): string | undefined {
  if (!data) return undefined
  const resource = data.resource ?? 'record'
  const operation = data.operation ?? 'create'

  if (resource === 'base') {
    return operation === 'getSchema' ? data.getSchemaBase : undefined
  }

  // Record operations — each has its own base field
  const baseFieldMap: Record<string, string> = {
    create: 'createBase',
    delete: 'deleteBase',
    get: 'getBase',
    search: 'searchBase',
    update: 'updateBase',
    upsert: 'upsertBase',
  }
  const field = baseFieldMap[operation]
  return field ? data[field] : undefined
}

/** Resolve the current table ID from whichever operation-prefixed field is active. */
function getCurrentTable(data: any): string | undefined {
  if (!data) return undefined
  const operation = data.operation ?? 'create'

  const tableFieldMap: Record<string, string> = {
    create: 'createTable',
    delete: 'deleteTable',
    get: 'getTable',
    search: 'searchTable',
    update: 'updateTable',
    upsert: 'upsertTable',
  }
  const field = tableFieldMap[operation]
  return field ? data[field] : undefined
}

export function AirtablePanel() {
  const api = useWorkflow<typeof airtableSchema>(airtableSchema)
  const { data, updateData, OptionsInput, VarFieldGroup, FieldRow, FieldDivider, Section, ConditionalRender } = api

  const resource = (data?.resource ?? 'record') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  // Auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  // Resolve current base/table from active operation fields
  const currentBase = getCurrentBase(data)
  const currentTable = getCurrentTable(data)

  // Determine what data needs to be loaded
  const needsBases =
    resource === 'record' || (resource === 'base' && operation === 'getSchema')

  const needsTables = resource === 'record' && !!currentBase

  const needsFields =
    resource === 'record' &&
    ['create', 'update', 'upsert', 'search'].includes(operation) &&
    !!currentBase &&
    !!currentTable

  const needsViews =
    resource === 'record' && operation === 'search' && !!currentBase && !!currentTable

  // Data fetchers with composite cache keys
  const { data: bases, loading: basesLoading } = useAirtableData(
    'bases',
    listBases,
    { enabled: needsBases },
  )

  const fetchTables = useCallback(
    () => listTables(currentBase!),
    [currentBase],
  )
  const { data: tables, loading: tablesLoading } = useAirtableData(
    `tables:${currentBase}`,
    fetchTables,
    { enabled: needsTables },
  )

  const fetchFields = useCallback(
    () => listFields(currentBase!, currentTable!, { writableOnly: true }),
    [currentBase, currentTable],
  )
  const { data: fields, loading: fieldsLoading } = useAirtableData(
    `fields:${currentBase}:${currentTable}`,
    fetchFields,
    { enabled: needsFields },
  )

  const fetchViews = useCallback(
    () => listViews(currentBase!, currentTable!),
    [currentBase, currentTable],
  )
  const { data: views, loading: viewsLoading } = useAirtableData(
    `views:${currentBase}:${currentTable}`,
    fetchViews,
    { enabled: needsViews },
  )

  return (
    <WorkflowPanel>
      {/* Resource/Operation selector row */}
      <Section title="Operation">
        <VarFieldGroup>
          <ConditionalRender when={(d) => d.resource === 'record'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.record} expand />
            </FieldRow>
          </ConditionalRender>

          <ConditionalRender when={(d) => d.resource === 'base'}>
            <FieldRow>
              <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
              <FieldDivider />
              <OptionsInput name="operation" options={OPERATIONS.base} expand />
            </FieldRow>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      {/* Resource-specific panels */}
      <ConditionalRender when={(d) => d.resource === 'record'}>
        <RecordPanel
          api={api}
          bases={bases}
          basesLoading={basesLoading}
          tables={tables}
          tablesLoading={tablesLoading}
          fields={fields}
          fieldsLoading={fieldsLoading}
          views={views}
          viewsLoading={viewsLoading}
        />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'base'}>
        <BasePanel api={api} bases={bases} basesLoading={basesLoading} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
