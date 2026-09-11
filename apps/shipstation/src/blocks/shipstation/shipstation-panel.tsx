// src/blocks/shipstation/shipstation-panel.tsx

import { useWorkflow, WorkflowPanel } from '@auxx/sdk/client'
import { useEffect } from 'react'
import { AddressPanel } from './resources/address/address-panel'
import { CarrierPanel } from './resources/carrier/carrier-panel'
import { OPERATIONS, RESOURCES } from './resources/constants'
import { FulfillmentPanel } from './resources/fulfillment/fulfillment-panel'
import { LabelPanel } from './resources/label/label-panel'
import { RatePanel } from './resources/rate/rate-panel'
import { ShipmentPanel } from './resources/shipment/shipment-panel'
import { TrackingPanel } from './resources/tracking/tracking-panel'
import { shipstationSchema } from './shipstation-schema'
import { useCapabilities } from './shared/use-capabilities'

export function ShipstationPanel() {
  const api = useWorkflow<typeof shipstationSchema>(shipstationSchema)

  const {
    data,
    updateData,
    OptionsInput,
    VarFieldGroup,
    FieldRow,
    FieldDivider,
    Section,
    ConditionalRender,
  } = api

  const resource = (data?.resource ?? 'shipment') as string
  const operation = data?.operation ?? 'getMany'

  // What this installation's settings permit. Narrowing the pickers is a
  // usability affordance; `shipstationExecute` is the actual guard.
  const { capabilities } = useCapabilities()

  /** Operation options for a resource, minus anything the settings forbid. */
  const allowedOperations = (res: string) => {
    const allowed = capabilities.operations[res]
    const all = OPERATIONS[res] ?? []
    return allowed ? all.filter((op) => allowed.includes(op.value)) : all
  }

  const resourceOptions = RESOURCES.filter((r) => capabilities.resources.includes(r.value))

  // Reset the operation when the resource changes, or when narrowing makes the
  // current selection unavailable (a workflow built while writes were enabled,
  // opened after they were turned off).
  useEffect(() => {
    if (!data) return
    const validOps = allowedOperations(resource)
    if (validOps.length > 0 && !validOps.some((op) => op.value === operation)) {
      updateData({ operation: validOps[0].value })
    }
  }, [resource, capabilities])

  return (
    <WorkflowPanel>
      <Section title="Operation">
        <VarFieldGroup>
          {Object.keys(OPERATIONS).map((res) => (
            <ConditionalRender key={res} when={(d) => d.resource === res}>
              <FieldRow>
                <OptionsInput
                  name="resource"
                  options={resourceOptions}
                  acceptsVariables={false}
                  variant="outline"
                />
                <FieldDivider />
                <OptionsInput name="operation" options={allowedOperations(res)} expand />
              </FieldRow>
            </ConditionalRender>
          ))}
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d) => d.resource === 'shipment'}>
        <ShipmentPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'label'}>
        <LabelPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'tracking'}>
        <TrackingPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'rate'}>
        <RatePanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'carrier'}>
        <CarrierPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'address'}>
        <AddressPanel api={api} />
      </ConditionalRender>

      <ConditionalRender when={(d) => d.resource === 'fulfillment'}>
        <FulfillmentPanel api={api} />
      </ConditionalRender>
    </WorkflowPanel>
  )
}
