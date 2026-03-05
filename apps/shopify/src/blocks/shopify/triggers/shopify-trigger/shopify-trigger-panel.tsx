// src/blocks/shopify/triggers/shopify-trigger/shopify-trigger-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { shopifyTriggerSchema } from './shopify-trigger-schema'

export function ShopifyTriggerPanel() {
  const { OptionsInput, VarField, VarFieldGroup, Section } =
    useWorkflow<typeof shopifyTriggerSchema>(shopifyTriggerSchema)

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
