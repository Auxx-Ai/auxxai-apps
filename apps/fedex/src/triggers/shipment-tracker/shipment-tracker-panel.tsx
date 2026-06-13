// src/triggers/shipment-tracker/shipment-tracker-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { shipmentTrackerSchema } from './shipment-tracker-schema'

export function ShipmentTrackerPanel() {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } =
    useWorkflow<typeof shipmentTrackerSchema>(shipmentTrackerSchema)

  // The platform renders the polling-interval selector itself — we only expose
  // what to watch and which changes to fire on.
  return (
    <WorkflowPanel>
      <Section title="Shipments to watch">
        <VarFieldGroup>
          <VarField>
            <StringInput name="trackingNumbers" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="By reference" collapsible>
        <VarFieldGroup>
          <VarField>
            <StringInput name="reference" />
          </VarField>
          <ConditionalRender when={(d) => Boolean(d.reference)}>
            <VarField>
              <OptionsInput name="referenceType" />
            </VarField>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      <Section title="Filter">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="statusTypes" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
