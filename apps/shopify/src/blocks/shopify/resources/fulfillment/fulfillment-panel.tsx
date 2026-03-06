// src/blocks/shopify/resources/fulfillment/fulfillment-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shopifySchema } from '../../shopify-schema'

type SelectOption = { label: string; value: string }

interface FulfillmentPanelProps {
  api: UseWorkflowApi<typeof shopifySchema>
  locations: SelectOption[]
  locationsLoading: boolean
}

export function FulfillmentPanel({ api, locations, locationsLoading }: FulfillmentPanelProps) {
  const { StringInput, OptionsInput, BooleanInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  const locationOptions = locationsLoading
    ? [{ label: 'Loading locations...', value: '' }]
    : locations

  return (
    <>
      {/* Shared: Order ID */}
      <Section title="Order">
        <VarFieldGroup>
          <VarField>
            <StringInput name="orderId" />
          </VarField>
        </VarFieldGroup>
      </Section>

      {/* Fulfillment: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Fulfillment">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="createLocationId" options={locationOptions} />
            </VarField>
            <VarField>
              <BooleanInput name="createNotifyCustomer" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Tracking" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="createTrackingNumber" />
            </VarField>
            <VarField>
              <StringInput name="createTrackingCompany" />
            </VarField>
            <VarField>
              <StringInput name="createTrackingUrl" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Fulfillment: Update Tracking */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Fulfillment">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateFulfillmentId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Update Tracking">
          <VarFieldGroup>
            <VarField>
              <StringInput name="updateTrackingNumber" />
            </VarField>
            <VarField>
              <StringInput name="updateTrackingCompany" />
            </VarField>
            <VarField>
              <StringInput name="updateTrackingUrl" />
            </VarField>
            <VarField>
              <BooleanInput name="updateNotifyCustomer" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Fulfillment: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Fulfillment">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getFulfillmentId" />
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

      {/* Fulfillment: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Fulfillments">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="getManyLimit" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Filters" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="getManyCreatedAtMin" />
            </VarField>
            <VarField>
              <StringInput name="getManyCreatedAtMax" />
            </VarField>
            <VarField>
              <StringInput name="getManyFields" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Fulfillment: Cancel */}
      <ConditionalRender when={(d) => d.operation === 'cancel'}>
        <Section title="Cancel Fulfillment">
          <VarFieldGroup>
            <VarField>
              <StringInput name="cancelFulfillmentId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
