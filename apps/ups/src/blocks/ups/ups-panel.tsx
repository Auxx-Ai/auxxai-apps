// src/blocks/ups/ups-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { upsSchema } from './ups-schema'
import { OPERATIONS } from './constants'

export function UpsPanel() {
  const {
    StringInput,
    OptionsInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = useWorkflow<typeof upsSchema>(upsSchema)

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="operation" options={OPERATIONS.shipment} />
          </VarField>
        </VarFieldGroup>
      </Section>

      {/* Track / Watch / Unwatch — all keyed on a tracking number */}
      <Section title="Shipment">
        <VarFieldGroup>
          <VarField>
            <StringInput name="trackingNumber" />
          </VarField>
          <ConditionalRender when={(d) => d.operation === 'watch'}>
            <VarField>
              <StringInput name="recordId" />
            </VarField>
          </ConditionalRender>
        </VarFieldGroup>
      </Section>

      {/* Delivery proof — opt-in, track only */}
      <ConditionalRender when={(d) => d.operation === 'track'}>
        <Section title="Delivery proof" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="includeProofOfDelivery" />
            </VarField>
            <VarField>
              <BooleanInput name="includeSignature" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </WorkflowPanel>
  )
}
