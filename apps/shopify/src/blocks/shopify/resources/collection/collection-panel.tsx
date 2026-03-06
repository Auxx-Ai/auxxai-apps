// src/blocks/shopify/resources/collection/collection-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface CollectionPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function CollectionPanel({ api }: CollectionPanelProps) {
  const { StringInput, BooleanInput, OptionsInput, VarInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Collection: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Collection">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createTitle" />
            </VarField>
            <VarField>
              <StringInput name="createBodyHtml" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="createPublished" />
            </VarField>
            <VarField>
              <OptionsInput name="createSortOrder" />
            </VarField>
            <VarField>
              <StringInput name="createTemplateSuffix" />
            </VarField>
            <VarField>
              <StringInput name="createImageUrl" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Collection: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Collection">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateCollectionId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateTitle" />
            </VarField>
            <VarField>
              <StringInput name="updateBodyHtml" />
            </VarField>
            <VarField>
              <OptionsInput name="updatePublished" />
            </VarField>
            <VarField>
              <OptionsInput name="updateSortOrder" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Collection: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Collection">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getCollectionId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <VarInput name="getFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Collection: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Collections">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyType" />
            </VarField>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filters" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyProductId" />
            </VarField>
            <VarField>
              <StringInput name="getManyTitle" />
            </VarField>
            <VarField>
              <VarInput name="getManyFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Collection: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Collection to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteCollectionId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Collection: Add Product */}
      <ConditionalRender when={(d) => d.operation === 'addProduct'}>
        <Section title="Add Product to Collection">
          <VarFieldGroup>
            <VarField>
              <StringInput name="addProductCollectionId" />
            </VarField>
            <VarField>
              <StringInput name="addProductProductId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Collection: Remove Product */}
      <ConditionalRender when={(d) => d.operation === 'removeProduct'}>
        <Section title="Remove Product from Collection">
          <VarFieldGroup>
            <VarField>
              <StringInput name="removeProductCollectId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
