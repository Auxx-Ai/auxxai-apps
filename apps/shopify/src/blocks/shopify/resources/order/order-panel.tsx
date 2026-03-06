// src/blocks/shopify/resources/order/order-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

type SelectOption = { label: string; value: string }

interface OrderPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
  locations: SelectOption[]
  locationsLoading: boolean
}

export function OrderPanel({ api, locations, locationsLoading }: OrderPanelProps) {
  const { StringInput, OptionsInput, BooleanInput, VarInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Order: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Customer">
          <VarFieldGroup>
            <VarField>
              <StringInput name="createEmail" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="createFulfillmentStatus" />
            </VarField>
            <VarField>
              <StringInput name="createNote" />
            </VarField>
            <VarField>
              <StringInput name="createTags" />
            </VarField>
            <VarField>
              <BooleanInput name="createSendReceipt" />
            </VarField>
            <VarField>
              <BooleanInput name="createSendFulfillmentReceipt" />
            </VarField>
            <VarField>
              <OptionsInput name="createInventoryBehaviour" />
            </VarField>
            <VarField>
              <OptionsInput
                name="createLocationId"
                options={
                  locationsLoading ? [{ label: 'Loading locations...', value: '' }] : locations
                }
              />
            </VarField>
            <VarField>
              <StringInput name="createSourceName" />
            </VarField>
            <VarField>
              <BooleanInput name="createTest" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Shipping Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createShippingFirstName" />
            </VarField>
            <VarField>
              <StringInput name="createShippingLastName" />
            </VarField>
            <VarField>
              <StringInput name="createShippingAddress1" />
            </VarField>
            <VarField>
              <StringInput name="createShippingAddress2" />
            </VarField>
            <VarField>
              <StringInput name="createShippingCity" />
            </VarField>
            <VarField>
              <StringInput name="createShippingProvince" />
            </VarField>
            <VarField>
              <StringInput name="createShippingCountry" />
            </VarField>
            <VarField>
              <StringInput name="createShippingZip" />
            </VarField>
            <VarField>
              <StringInput name="createShippingPhone" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Billing Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createBillingFirstName" />
            </VarField>
            <VarField>
              <StringInput name="createBillingLastName" />
            </VarField>
            <VarField>
              <StringInput name="createBillingAddress1" />
            </VarField>
            <VarField>
              <StringInput name="createBillingAddress2" />
            </VarField>
            <VarField>
              <StringInput name="createBillingCity" />
            </VarField>
            <VarField>
              <StringInput name="createBillingProvince" />
            </VarField>
            <VarField>
              <StringInput name="createBillingCountry" />
            </VarField>
            <VarField>
              <StringInput name="createBillingZip" />
            </VarField>
            <VarField>
              <StringInput name="createBillingPhone" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Order: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Order to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteOrderId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Order: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Order">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getOrderId" />
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

      {/* Order: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Orders">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
            <VarField>
              <OptionsInput name="getManyStatus" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filters" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyFinancialStatus" />
            </VarField>
            <VarField>
              <OptionsInput name="getManyFulfillmentStatus" />
            </VarField>
            <VarField>
              <StringInput name="getManyCreatedAtMin" />
            </VarField>
            <VarField>
              <StringInput name="getManyCreatedAtMax" />
            </VarField>
            <VarField>
              <StringInput name="getManyUpdatedAtMin" />
            </VarField>
            <VarField>
              <StringInput name="getManyUpdatedAtMax" />
            </VarField>
            <VarField>
              <VarInput name="getManyFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Order: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Order">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateOrderId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Fields">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateEmail" />
            </VarField>
            <VarField>
              <StringInput name="updateNote" />
            </VarField>
            <VarField>
              <StringInput name="updateTags" />
            </VarField>
            <VarField>
              <StringInput name="updateSourceName" />
            </VarField>
            <VarField>
              <OptionsInput
                name="updateLocationId"
                options={
                  locationsLoading ? [{ label: 'Loading locations...', value: '' }] : locations
                }
              />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Shipping Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateShippingFirstName" />
            </VarField>
            <VarField>
              <StringInput name="updateShippingLastName" />
            </VarField>
            <VarField>
              <StringInput name="updateShippingAddress1" />
            </VarField>
            <VarField>
              <StringInput name="updateShippingAddress2" />
            </VarField>
            <VarField>
              <StringInput name="updateShippingCity" />
            </VarField>
            <VarField>
              <StringInput name="updateShippingProvince" />
            </VarField>
            <VarField>
              <StringInput name="updateShippingCountry" />
            </VarField>
            <VarField>
              <StringInput name="updateShippingZip" />
            </VarField>
            <VarField>
              <StringInput name="updateShippingPhone" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
