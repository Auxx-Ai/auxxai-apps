// src/blocks/shopify/triggers/shopify-trigger/shopify-trigger-panel.tsx

import { useEffect } from 'react'
import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { shopifyTriggerSchema } from './shopify-trigger-schema'

export function ShopifyTriggerPanel() {
  const { data, updateData, OptionsInput, VarField, VarFieldGroup, Section } =
    useWorkflow<typeof shopifyTriggerSchema>(shopifyTriggerSchema)

  useEffect(() => {
    const rawTopic = data?.topic
    const topics: string[] = Array.isArray(rawTopic)
      ? rawTopic
      : rawTopic
        ? [rawTopic as string]
        : []

    const filters = topics.length > 0 ? { topic: topics } : undefined
    const current = (data as any)?.triggerFilters

    const filtersJson = JSON.stringify(filters)
    const currentJson = JSON.stringify(current)
    if (filtersJson !== currentJson) {
      updateData({ triggerFilters: filters } as any)
    }
  }, [data?.topic])

  return (
    <WorkflowPanel>
      <Section title="Trigger">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="topic" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
