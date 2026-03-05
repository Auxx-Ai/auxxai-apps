// src/blocks/telegram/triggers/update-received/update-received-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { updateReceivedSchema } from './update-received-schema'

/** Map from schema input name → triggerData.updateType value */
const UPDATE_TYPE_MAP: Record<string, string> = {
  filterMessage: 'message',
  filterEditedMessage: 'edited_message',
  filterCallbackQuery: 'callback_query',
  filterChannelPost: 'channel_post',
  filterEditedChannelPost: 'edited_channel_post',
}

/** Parse a comma-separated string into a trimmed, non-empty array of strings */
function parseCSV(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Build triggerFilters from the panel input values.
 * Returns undefined if no filtering is needed (all types enabled, no ID filters).
 */
function buildTriggerFilters(data: Record<string, any>): Record<string, string[]> | undefined {
  const enabledTypes: string[] = []
  let allEnabled = true

  for (const [inputName, updateType] of Object.entries(UPDATE_TYPE_MAP)) {
    // Default to true if not explicitly set
    if (data[inputName] !== false) {
      enabledTypes.push(updateType)
    } else {
      allEnabled = false
    }
  }

  const chatIds = parseCSV(data.allowedChatIds)
  const userIds = parseCSV(data.allowedUserIds)

  // No filtering needed — all types enabled, no ID filters
  if (allEnabled && chatIds.length === 0 && userIds.length === 0) {
    return undefined
  }

  const filters: Record<string, string[]> = {}

  if (!allEnabled) {
    filters.updateType = enabledTypes
  }
  if (chatIds.length > 0) {
    filters.chatId = chatIds
  }
  if (userIds.length > 0) {
    filters.fromUserId = userIds
  }

  return filters
}

export function UpdateReceivedPanel() {
  const {
    data,
    updateData,
    BooleanInput,
    StringInput,
    VarField,
    VarFieldGroup,
    Section,
  } = useWorkflow<typeof updateReceivedSchema>(updateReceivedSchema)

  // Recompute triggerFilters whenever filter inputs change
  useEffect(() => {
    const filters = buildTriggerFilters(data ?? {})
    const current = (data as any)?.triggerFilters

    // Avoid infinite loop — only update if changed
    const filtersJson = JSON.stringify(filters)
    const currentJson = JSON.stringify(current)
    if (filtersJson !== currentJson) {
      updateData({ triggerFilters: filters } as any)
    }
  }, [
    data?.filterMessage,
    data?.filterEditedMessage,
    data?.filterCallbackQuery,
    data?.filterChannelPost,
    data?.filterEditedChannelPost,
    data?.allowedChatIds,
    data?.allowedUserIds,
  ])

  return (
    <WorkflowPanel>
      <Section title="Update Types">
        <VarFieldGroup>
          <VarField>
            <BooleanInput name="filterMessage" />
          </VarField>
          <VarField>
            <BooleanInput name="filterEditedMessage" />
          </VarField>
          <VarField>
            <BooleanInput name="filterCallbackQuery" />
          </VarField>
          <VarField>
            <BooleanInput name="filterChannelPost" />
          </VarField>
          <VarField>
            <BooleanInput name="filterEditedChannelPost" />
          </VarField>
        </VarFieldGroup>
      </Section>
      <Section title="Filters" collapsible>
        <VarFieldGroup>
          <VarField>
            <StringInput name="allowedChatIds" placeholder="e.g. -100123456, 789012" />
          </VarField>
          <VarField>
            <StringInput name="allowedUserIds" placeholder="e.g. 123456789, 987654321" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
