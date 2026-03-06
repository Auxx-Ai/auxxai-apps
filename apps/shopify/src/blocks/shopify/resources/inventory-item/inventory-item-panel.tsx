// src/blocks/shopify/resources/inventory-item/inventory-item-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface InventoryItemPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function InventoryItemPanel({ api }: InventoryItemPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Inventory Item: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Inventory Item">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getInventoryItemId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Inventory Item: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Inventory Items">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyIds" />
            </VarField>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Inventory Item: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Inventory Item">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateInventoryItemId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateCost" />
            </VarField>
            <VarField>
              <OptionsInput name="updateTracked" />
            </VarField>
            <VarField>
              <StringInput name="updateCountryCodeOfOrigin" />
            </VarField>
            <VarField>
              <StringInput name="updateHarmonizedSystemCode" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
