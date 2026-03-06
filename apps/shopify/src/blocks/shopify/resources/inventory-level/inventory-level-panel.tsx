// src/blocks/shopify/resources/inventory-level/inventory-level-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

type SelectOption = { label: string; value: string }

interface InventoryLevelPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
  locations: SelectOption[]
  locationsLoading: boolean
}

export function InventoryLevelPanel({
  api,
  locations,
  locationsLoading,
}: InventoryLevelPanelProps) {
  const { StringInput, NumberInput, BooleanInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  const locationOptions = locationsLoading
    ? [{ label: 'Loading locations...', value: '' }]
    : locations

  return (
    <>
      {/* Inventory Level: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Inventory Levels">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyInventoryItemIds" />
            </VarField>
            <VarField>
              <StringInput name="getManyLocationIds" />
            </VarField>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Inventory Level: Set */}
      <ConditionalRender when={(d) => d.operation === 'set'}>
        <Section title="Set Inventory Level">
          <VarFieldGroup>
            <VarField>
              <StringInput name="setInventoryItemId" />
            </VarField>
            <VarField>
              <OptionsInput name="setLocationId" options={locationOptions} />
            </VarField>
            <VarField>
              <NumberInput name="setAvailable" />
            </VarField>
            <VarField>
              <BooleanInput name="setDisconnectIfNecessary" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Inventory Level: Adjust */}
      <ConditionalRender when={(d) => d.operation === 'adjust'}>
        <Section title="Adjust Inventory Level">
          <VarFieldGroup>
            <VarField>
              <StringInput name="adjustInventoryItemId" />
            </VarField>
            <VarField>
              <OptionsInput name="adjustLocationId" options={locationOptions} />
            </VarField>
            <VarField>
              <NumberInput name="adjustAvailableAdjustment" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Inventory Level: Connect */}
      <ConditionalRender when={(d) => d.operation === 'connect'}>
        <Section title="Connect Inventory Level">
          <VarFieldGroup>
            <VarField>
              <StringInput name="connectInventoryItemId" />
            </VarField>
            <VarField>
              <OptionsInput name="connectLocationId" options={locationOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Inventory Level: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Delete Inventory Level">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteInventoryItemId" />
            </VarField>
            <VarField>
              <OptionsInput name="deleteLocationId" options={locationOptions} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
