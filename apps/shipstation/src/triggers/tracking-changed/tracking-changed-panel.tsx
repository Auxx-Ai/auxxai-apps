// src/triggers/tracking-changed/tracking-changed-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { trackingChangedSchema } from './tracking-changed-schema'

/**
 * Panel for `shipstation.tracking-changed`.
 *
 * The platform renders the polling-interval selector itself, so this declares
 * only what to watch: the parcels, their carrier, and which status transitions
 * are worth firing on.
 */
export function TrackingChangedPanel() {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section } =
    useWorkflow<typeof trackingChangedSchema>(trackingChangedSchema)

  return (
    <WorkflowPanel>
      <Section title="Parcels to watch">
        <VarFieldGroup>
          <VarField>
            <StringInput name="trackingNumbers" />
          </VarField>
          <VarField>
            <StringInput name="carrierCode" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Filter">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="statusCodes" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
