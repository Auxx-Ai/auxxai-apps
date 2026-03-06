// src/blocks/shopify/resources/discount/discount-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

interface DiscountPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
}

export function DiscountPanel({ api }: DiscountPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Discount: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Discount">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createTitle" />
            </VarField>
            <VarField>
              <OptionsInput name="createValueType" />
            </VarField>
            <VarField>
              <StringInput name="createValue" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Rules" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="createTargetType" />
            </VarField>
            <VarField>
              <OptionsInput name="createTargetSelection" />
            </VarField>
            <VarField>
              <OptionsInput name="createAllocationMethod" />
            </VarField>
            <VarField>
              <OptionsInput name="createCustomerSelection" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Schedule & Limits" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createStartsAt" />
            </VarField>
            <VarField>
              <StringInput name="createEndsAt" />
            </VarField>
            <VarField>
              <StringInput name="createUsageLimit" />
            </VarField>
            <VarField>
              <OptionsInput name="createOncePerCustomer" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Prerequisites" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createMinSubtotal" />
            </VarField>
            <VarField>
              <StringInput name="createMinQuantity" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Discount: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Discount">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updatePriceRuleId" />
            </VarField>
            <VarField>
              <StringInput name="updateDiscountCodeId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateCode" />
            </VarField>
            <VarField>
              <StringInput name="updateValue" />
            </VarField>
            <VarField>
              <StringInput name="updateEndsAt" />
            </VarField>
            <VarField>
              <StringInput name="updateUsageLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Discount: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Discount">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getPriceRuleId" />
            </VarField>
            <VarField>
              <StringInput name="getDiscountCodeId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Discount: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Discounts">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyPriceRuleId" />
            </VarField>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Discount: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Discount to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deletePriceRuleId" />
            </VarField>
            <VarField>
              <StringInput name="deleteDiscountCodeId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
