// src/blocks/whatsapp/triggers/message-received/message-received-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { messageReceivedSchema } from './message-received-schema'

function resolveEventTypes(data: Record<string, any>): string[] {
  if (data.eventTypes !== undefined) {
    return Array.isArray(data.eventTypes) ? data.eventTypes : [data.eventTypes]
  }
  // Backwards compat: derive from legacy boolean fields
  const types: string[] = []
  if (data.filterMessages !== false) types.push('message')
  if (data.filterStatusUpdates === true) types.push('status')
  return types
}

function buildTriggerFilters(data: Record<string, any>): Record<string, string[]> | undefined {
  const enabledTypes = resolveEventTypes(data)
  const filters: Record<string, string[]> = {}

  const bothEnabled = enabledTypes.includes('message') && enabledTypes.includes('status')
  const onlyMessages = enabledTypes.length === 1 && enabledTypes[0] === 'message'

  if (!bothEnabled && !onlyMessages) {
    filters.eventType = enabledTypes
  } else if (bothEnabled) {
    filters.eventType = enabledTypes
  }

  if (enabledTypes.includes('status') && data.filterStatuses && data.filterStatuses !== 'all') {
    filters.statusType = [data.filterStatuses]
  }

  return Object.keys(filters).length > 0 ? filters : undefined
}

export function MessageReceivedPanel() {
  const { data, updateData, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } =
    useWorkflow<typeof messageReceivedSchema>(messageReceivedSchema)

  useEffect(() => {
    const filters = buildTriggerFilters(data ?? {})
    const current = (data as any)?.triggerFilters

    const filtersJson = JSON.stringify(filters)
    const currentJson = JSON.stringify(current)
    if (filtersJson !== currentJson) {
      updateData({ triggerFilters: filters } as any)
    }
  }, [data?.eventTypes, data?.filterStatuses])

  return (
    <WorkflowPanel>
      <Section title="Event Types">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="eventTypes" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <ConditionalRender
        when={(d) => {
          const types = Array.isArray(d.eventTypes)
            ? d.eventTypes
            : d.eventTypes
              ? [d.eventTypes]
              : []
          return types.includes('status')
        }}
      >
        <Section title="Status Filter">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="filterStatuses" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </WorkflowPanel>
  )
}
