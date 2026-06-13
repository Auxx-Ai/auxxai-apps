// src/triggers/shipment-status-changed/shipment-status-changed-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { shipmentStatusChangedSchema } from './shipment-status-changed-schema'

export function ShipmentStatusChangedPanel() {
  const { OptionsInput, VarField, VarFieldGroup, Section } = useWorkflow<
    typeof shipmentStatusChangedSchema
  >(shipmentStatusChangedSchema)

  // The platform renders the polling-interval selector itself — we only expose
  // the status filter.
  return (
    <WorkflowPanel>
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
