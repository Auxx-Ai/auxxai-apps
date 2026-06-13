// src/blocks/fedex/fedex-panel.tsx

import { WorkflowPanel, useWorkflow } from '@auxx/sdk/client'
import { fedexSchema } from './fedex-schema'
import { OPERATIONS } from './constants'

export function FedexPanel() {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } =
    useWorkflow<typeof fedexSchema>(fedexSchema)

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="operation" options={OPERATIONS.shipment} />
          </VarField>
        </VarFieldGroup>
      </Section>

      {/* Track by number / Watch / Unwatch — all keyed on a tracking number */}
      <ConditionalRender when={(d) => d.operation !== 'trackByReference'}>
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
      </ConditionalRender>

      {/* Track by reference */}
      <ConditionalRender when={(d) => d.operation === 'trackByReference'}>
        <Section title="Reference">
          <VarFieldGroup>
            <VarField>
              <StringInput name="reference" />
            </VarField>
            <VarField>
              <OptionsInput name="referenceType" />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Ship date window" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="shipDateBegin" />
            </VarField>
            <VarField>
              <StringInput name="shipDateEnd" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </WorkflowPanel>
  )
}
