// src/blocks/shipstation/resources/fulfillment/fulfillment-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shipstationSchema } from '../../shipstation-schema'

interface FulfillmentPanelProps {
  api: UseWorkflowApi<typeof shipstationSchema>
}

/**
 * The `fulfillment` resource panel.
 *
 * Tracking number sits alone at the top because it is the reason this operation
 * exists: it is the only list in the block that matches a child box's number.
 * Everything else is a collapsed filter section.
 */
export function FulfillmentPanel({ api }: FulfillmentPanelProps) {
  const {
    StringInput,
    NumberInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <ConditionalRender when={(d) => d.operation === 'getMany'}>
      <Section title="Find By Tracking Number">
        <VarFieldGroup>
          <VarField>
            <StringInput name="fulfillmentGetManyTrackingNumber" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Filters" collapsible>
        <VarFieldGroup>
          <VarField>
            <StringInput name="fulfillmentGetManyShipmentId" />
          </VarField>
          <VarField>
            <StringInput name="fulfillmentGetManyFulfillmentId" />
          </VarField>
          <VarField>
            <StringInput name="fulfillmentGetManyShipmentNumber" />
          </VarField>
          <VarField>
            <StringInput name="fulfillmentGetManyBatchId" />
          </VarField>
          <VarField>
            <StringInput name="fulfillmentGetManyOrderSourceId" />
          </VarField>
          <VarField>
            <StringInput name="fulfillmentGetManyShipToName" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Dates" collapsible>
        <VarFieldGroup>
          <VarField>
            <StringInput name="fulfillmentGetManyShipDateStart" />
          </VarField>
          <VarField>
            <StringInput name="fulfillmentGetManyShipDateEnd" />
          </VarField>
          <VarField>
            <StringInput name="fulfillmentGetManyCreateDateStart" />
          </VarField>
          <VarField>
            <StringInput name="fulfillmentGetManyCreateDateEnd" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Paging" collapsible>
        <VarFieldGroup>
          <VarField>
            <NumberInput name="fulfillmentGetManyPage" />
          </VarField>
          <VarField>
            <NumberInput name="fulfillmentGetManyPageSize" />
          </VarField>
          <VarField>
            <OptionsInput name="fulfillmentGetManySortBy" />
          </VarField>
          <VarField>
            <OptionsInput name="fulfillmentGetManySortDir" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </ConditionalRender>
  )
}
