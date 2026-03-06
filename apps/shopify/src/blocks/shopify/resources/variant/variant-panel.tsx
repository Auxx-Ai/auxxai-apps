// src/blocks/shopify/resources/variant/variant-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface VariantPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function VariantPanel({ api }: VariantPanelProps) {
  const {
    StringInput,
    OptionsInput,
    BooleanInput,
    NumberInput,
    VarInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Shared: Product ID */}
      <Section title="Product">
        <VarFieldGroup>
          <VarField>
            <StringInput name="productId" />
          </VarField>
        </VarFieldGroup>
      </Section>

      {/* Variant: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Variant">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createTitle" />
            </VarField>
            <VarField>
              <VarInput name="createPrice" />
            </VarField>
            <VarField>
              <VarInput name="createCompareAtPrice" />
            </VarField>
            <VarField>
              <StringInput name="createSku" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createOption1" />
            </VarField>
            <VarField>
              <StringInput name="createOption2" />
            </VarField>
            <VarField>
              <StringInput name="createOption3" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Shipping & Inventory" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createBarcode" />
            </VarField>
            <VarField>
              <NumberInput name="createWeight" />
            </VarField>
            <VarField>
              <OptionsInput name="createWeightUnit" />
            </VarField>
            <VarField>
              <NumberInput name="createInventoryQuantity" />
            </VarField>
            <VarField>
              <OptionsInput name="createInventoryPolicy" />
            </VarField>
            <VarField>
              <StringInput name="createFulfillmentService" />
            </VarField>
            <VarField>
              <BooleanInput name="createRequiresShipping" />
            </VarField>
            <VarField>
              <BooleanInput name="createTaxable" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Variant: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Variant">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateVariantId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateTitle" />
            </VarField>
            <VarField>
              <VarInput name="updatePrice" />
            </VarField>
            <VarField>
              <VarInput name="updateCompareAtPrice" />
            </VarField>
            <VarField>
              <StringInput name="updateSku" />
            </VarField>
            <VarField>
              <StringInput name="updateBarcode" />
            </VarField>
            <VarField>
              <NumberInput name="updateWeight" />
            </VarField>
            <VarField>
              <OptionsInput name="updateWeightUnit" />
            </VarField>
            <VarField>
              <OptionsInput name="updateInventoryPolicy" />
            </VarField>
            <VarField>
              <OptionsInput name="updateTaxable" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateOption1" />
            </VarField>
            <VarField>
              <StringInput name="updateOption2" />
            </VarField>
            <VarField>
              <StringInput name="updateOption3" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Variant: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Variant">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getVariantId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Variant: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Variants">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
            <VarField>
              <StringInput name="getManyFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Variant: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Variant to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteVariantId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
