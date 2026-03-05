// src/blocks/whatsapp/triggers/message-received/message-received-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { messageReceivedSchema } from './message-received-schema'

function buildTriggerFilters(data: Record<string, any>): Record<string, string[]> | undefined {
  const enabledTypes: string[] = []
  let hasAnyFilter = false

  if (data.filterMessages !== false) {
    enabledTypes.push('message')
  } else {
    hasAnyFilter = true
  }

  if (data.filterStatusUpdates === true) {
    enabledTypes.push('status')
  }

  // If not filtering status updates and messages are enabled, no event type filter needed
  const needsEventTypeFilter = hasAnyFilter || data.filterStatusUpdates === true

  const filters: Record<string, string[]> = {}

  if (needsEventTypeFilter) {
    filters.eventType = enabledTypes
  }

  if (data.filterStatusUpdates && data.filterStatuses && data.filterStatuses !== 'all') {
    filters.statusType = [data.filterStatuses]
  }

  return Object.keys(filters).length > 0 ? filters : undefined
}

export function MessageReceivedPanel() {
  const {
    data,
    updateData,
    BooleanInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = useWorkflow<typeof messageReceivedSchema>(messageReceivedSchema)

  useEffect(() => {
    const filters = buildTriggerFilters(data ?? {})
    const current = (data as any)?.triggerFilters

    const filtersJson = JSON.stringify(filters)
    const currentJson = JSON.stringify(current)
    if (filtersJson !== currentJson) {
      updateData({ triggerFilters: filters } as any)
    }
  }, [data?.filterMessages, data?.filterStatusUpdates, data?.filterStatuses])

  return (
    <WorkflowPanel>
      <Section title="Event Types">
        <VarFieldGroup>
          <VarField>
            <BooleanInput name="filterMessages" />
          </VarField>
          <VarField>
            <BooleanInput name="filterStatusUpdates" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.filterStatusUpdates === true}>
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
