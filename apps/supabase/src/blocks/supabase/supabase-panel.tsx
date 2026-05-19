// src/blocks/supabase/supabase-panel.tsx

/**
 * Top-level Supabase panel component.
 *
 * Renders the Resource/Operation selector row and the Row resource panel.
 * Lazily loads:
 *   - Tables when any operation is active (in the configured schema)
 *   - Columns when an operation that needs them is active and a table is set
 */

import { useEffect, useCallback } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { supabaseSchema } from './supabase-schema'
import { OPERATIONS } from './resources/constants'
import { RowPanel } from './resources/row/row-panel'
import { useSupabaseData } from './shared/use-supabase-data'
import listTables from './shared/list-tables.server'
import listColumns from './shared/list-columns.server'

/** Resolve the table id from whichever operation-prefixed field is active. */
function getCurrentTable(data: any): string | undefined {
  if (!data) return undefined
  const operation = data.operation ?? 'create'
  const map: Record<string, string> = {
    create: 'createTable',
    delete: 'deleteTable',
    get: 'getTable',
    getMany: 'getManyTable',
    update: 'updateTable',
  }
  const field = map[operation]
  return field ? data[field] : undefined
}

/** Resolve the schema name from whichever operation-prefixed pair is active. */
function getCurrentSchema(data: any): string {
  if (!data) return 'public'
  const operation = data.operation ?? 'create'
  const customField = `${operation}CustomSchema`
  const schemaField = `${operation}Schema`
  if (!data[customField]) return 'public'
  const v = (data[schemaField] ?? '').toString().trim()
  return v || 'public'
}

export function SupabasePanel() {
  const api = useWorkflow<typeof supabaseSchema>(supabaseSchema)
  const {
    data,
    updateData,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
  } = api

  const resource = (data?.resource ?? 'row') as keyof typeof OPERATIONS
  const operation = data?.operation ?? 'create'

  // Forward compat: auto-reset operation when resource changes
  useEffect(() => {
    if (!data) return
    const validOps = OPERATIONS[resource]
    if (validOps && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource])

  const currentTable = getCurrentTable(data)
  const currentSchema = getCurrentSchema(data)

  const fetchTables = useCallback(() => listTables(currentSchema), [currentSchema])
  const { data: tables, loading: tablesLoading } = useSupabaseData(
    `tables:${currentSchema}`,
    fetchTables,
    { enabled: true }
  )

  const fetchColumns = useCallback(
    () => listColumns(currentTable!, currentSchema),
    [currentTable, currentSchema]
  )
  const { data: columns, loading: columnsLoading } = useSupabaseData(
    `columns:${currentSchema}:${currentTable}`,
    fetchColumns,
    { enabled: !!currentTable }
  )

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <FieldRow>
            <OptionsInput name="resource" acceptsVariables={false} variant="outline" />
            <FieldDivider />
            <OptionsInput name="operation" options={OPERATIONS.row} expand />
          </FieldRow>
        </VarFieldGroup>
      </Section>

      <RowPanel
        api={api}
        tables={tables}
        tablesLoading={tablesLoading}
        columns={columns}
        columnsLoading={columnsLoading}
      />
    </WorkflowPanel>
  )
}
