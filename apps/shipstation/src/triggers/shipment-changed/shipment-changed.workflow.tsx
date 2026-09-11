// src/triggers/shipment-changed/shipment-changed.workflow.tsx

import { defineTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import icon from '../../assets/icon.png'
import { ShipmentChangedPanel } from './shipment-changed-panel'
import { shipmentChangedSchema } from './shipment-changed-schema'
import shipmentChangedExecute from './shipment-changed.server'

function ShipmentChangedNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="ShipStation: Shipment changed" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

/**
 * Polling trigger over the `modified_at` delta on `GET /v2/shipments`.
 *
 * `config.polling` is what makes this a polling trigger; the interval selector
 * is rendered by the platform, not by the panel.
 */
export const shipmentChangedTrigger = defineTrigger({
  id: 'shipstation.shipment-changed',
  label: 'Shipment changed',
  description:
    'Polls ShipStation for shipments modified since the last check and fires once per changed shipment. The first poll only establishes the starting point; it does not replay history.',
  icon,
  color: '#0B5FFF',
  schema: shipmentChangedSchema,
  execute: shipmentChangedExecute,
  config: {
    requiresConnection: true,
    timeout: 30000,
    retries: 0,
    polling: { intervalMinutes: 15, minIntervalMinutes: 5 },
  },
  workflow: {
    node: ShipmentChangedNode,
    panel: ShipmentChangedPanel,
  },
})
