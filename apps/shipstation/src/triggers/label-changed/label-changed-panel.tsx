// src/triggers/label-changed/label-changed-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { labelChangedSchema } from './label-changed-schema'

/**
 * Panel for `shipstation.label-changed`.
 *
 * The platform renders the polling-interval selector itself, so this declares
 * only what to watch. `changeTypes` selects which of the trigger's two cursors
 * runs, mirroring how `fedex.shipment-tracker` filters `statusTypes`.
 */
export function LabelChangedPanel() {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section } =
    useWorkflow<typeof labelChangedSchema>(labelChangedSchema)

  return (
    <WorkflowPanel>
      <Section title="Changes to watch">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="changeTypes" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <Section title="Filter" collapsible>
        <VarFieldGroup>
          <VarField>
            <StringInput name="carrierId" />
          </VarField>
          <VarField>
            <StringInput name="serviceCode" />
          </VarField>
          <VarField>
            <StringInput name="warehouseId" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </WorkflowPanel>
  )
}
