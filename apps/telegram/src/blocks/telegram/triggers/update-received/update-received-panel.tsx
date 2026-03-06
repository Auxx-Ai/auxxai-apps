// src/blocks/telegram/triggers/update-received/update-received-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { updateReceivedSchema } from './update-received-schema'

/** Legacy boolean field → updateType value mapping for backwards compat */
const LEGACY_BOOLEAN_MAP: Record<string, string> = {
  filterMessage: 'message',
  filterEditedMessage: 'edited_message',
  filterCallbackQuery: 'callback_query',
  filterChannelPost: 'channel_post',
  filterEditedChannelPost: 'edited_channel_post',
}

const ALL_UPDATE_TYPES = Object.values(LEGACY_BOOLEAN_MAP)

function parseCSV(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function resolveUpdateTypes(data: Record<string, any>): string[] {
  if (data.updateTypes !== undefined) {
    return Array.isArray(data.updateTypes) ? data.updateTypes : [data.updateTypes]
  }
  // Backwards compat: derive from legacy boolean fields
  const types: string[] = []
  for (const [inputName, updateType] of Object.entries(LEGACY_BOOLEAN_MAP)) {
    if (data[inputName] !== false) {
      types.push(updateType)
    }
  }
  return types
}

function buildTriggerFilters(data: Record<string, any>): Record<string, string[]> | undefined {
  const enabledTypes = resolveUpdateTypes(data)
  const allEnabled = enabledTypes.length === ALL_UPDATE_TYPES.length

  const chatIds = parseCSV(data.allowedChatIds)
  const userIds = parseCSV(data.allowedUserIds)

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
  const { data, updateData, OptionsInput, StringInput, VarField, VarFieldGroup, Section } =
    useWorkflow<typeof updateReceivedSchema>(updateReceivedSchema)

  useEffect(() => {
    const filters = buildTriggerFilters(data ?? {})
    const current = (data as any)?.triggerFilters

    const filtersJson = JSON.stringify(filters)
    const currentJson = JSON.stringify(current)
    if (filtersJson !== currentJson) {
      updateData({ triggerFilters: filters } as any)
    }
  }, [data?.updateTypes, data?.allowedChatIds, data?.allowedUserIds])

  return (
    <WorkflowPanel>
      <Section title="Update Types">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="updateTypes" />
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
