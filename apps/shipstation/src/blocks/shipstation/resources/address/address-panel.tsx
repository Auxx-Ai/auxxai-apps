// src/blocks/shipstation/resources/address/address-panel.tsx

import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { shipstationSchema } from '../../shipstation-schema'

interface AddressPanelProps {
  api: UseWorkflowApi<typeof shipstationSchema>
}

/**
 * The `address` resource panel: one address field, nothing else.
 *
 * Deliberately no phone input. `POST /v2/addresses/validate` does not require
 * one, unlike shipment and label creation, and asking for a value the operation
 * ignores would teach an author the wrong thing about the rest of the block.
 */
export function AddressPanel({ api }: AddressPanelProps) {
  const { VarInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <ConditionalRender when={(d) => d.operation === 'validate'}>
      <Section title="Address">
        <VarFieldGroup>
          <VarField>
            <VarInput name="addressValidateAddress" />
          </VarField>
        </VarFieldGroup>
      </Section>
    </ConditionalRender>
  )
}
