// src/triggers/shipment-changed/shipment-changed-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { shipmentChangedSchema } from './shipment-changed-schema'

/**
 * Panel for `shipstation.shipment-changed`.
 *
 * The platform renders the polling-interval selector itself, so this declares
 * only what to watch: an optional store, status and tag narrowing, each of
 * which is a real `GET /v2/shipments` filter rather than an in-memory one.
 */
export function ShipmentChangedPanel() {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section } =
    useWorkflow<typeof shipmentChangedSchema>(shipmentChangedSchema)

  return (
    <WorkflowPanel>
      <Section title="Shipments to watch">
        <VarFieldGroup>
          <VarField>
            <StringInput name="storeId" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Filter" collapsible>
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="shipmentStatus" />
          </VarField>
          <VarField>
            <StringInput name="tag" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
