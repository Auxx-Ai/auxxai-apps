// src/blocks/shopify/resources/product/product-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface ProductPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function ProductPanel({ api }: ProductPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Product: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Product">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createTitle" />
            </VarField>
            <VarField>
              <StringInput name="createBodyHtml" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Details" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createVendor" />
            </VarField>
            <VarField>
              <StringInput name="createProductType" />
            </VarField>
            <VarField>
              <StringInput name="createTags" />
            </VarField>
            <VarField>
              <StringInput name="createHandle" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Publishing" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="createPublished" />
            </VarField>
            <VarField>
              <OptionsInput name="createPublishedScope" />
            </VarField>
            <VarField>
              <StringInput name="createTemplateSuffix" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createOptions" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Product: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Product to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteProductId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Product: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Product">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getProductId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getProductFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Product: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Products">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getProductManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filters" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getProductManyTitle" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyVendor" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyProductType" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyHandle" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyCollectionId" />
            </VarField>
            <VarField>
              <OptionsInput name="getProductManyPublishedStatus" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyCreatedAtMin" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyCreatedAtMax" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyUpdatedAtMin" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyUpdatedAtMax" />
            </VarField>
            <VarField>
              <StringInput name="getProductManyFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Product: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Product">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateProductId" />
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
              <StringInput name="updateVendor" />
            </VarField>
            <VarField>
              <StringInput name="updateProductType" />
            </VarField>
            <VarField>
              <StringInput name="updateTags" />
            </VarField>
            <VarField>
              <StringInput name="updateHandle" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Publishing" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="updatePublished" />
            </VarField>
            <VarField>
              <OptionsInput name="updatePublishedScope" />
            </VarField>
            <VarField>
              <StringInput name="updateTemplateSuffix" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateOptions" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
