// src/blocks/shopify/resources/metafield/metafield-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface MetafieldPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function MetafieldPanel({ api }: MetafieldPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Shared: Owner Resource */}
      <Section title="Owner">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="ownerResource" />
          </VarField>
          <ConditionalRender when={(d) => d.ownerResource !== 'shop'}>
            <VarField>
              <StringInput name="ownerId" />
            </VarField>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      {/* Metafield: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Metafield">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createNamespace" />
            </VarField>
            <VarField>
              <StringInput name="createKey" />
            </VarField>
            <VarField>
              <StringInput name="createValue" />
            </VarField>
            <VarField>
              <OptionsInput name="createType" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Metafield: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Metafield">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateMetafieldId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateValue" />
            </VarField>
            <VarField>
              <OptionsInput name="updateType" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Metafield: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Metafield">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getMetafieldId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Metafield: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Metafields">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filters" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyNamespace" />
            </VarField>
            <VarField>
              <StringInput name="getManyKey" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Metafield: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Metafield to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteMetafieldId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
