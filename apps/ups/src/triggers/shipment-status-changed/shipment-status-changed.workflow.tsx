// src/triggers/shipment-status-changed/shipment-status-changed.workflow.tsx

import { defineTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import icon from '../../assets/icon.png'
import { ShipmentStatusChangedPanel } from './shipment-status-changed-panel'
import { shipmentStatusChangedSchema } from './shipment-status-changed-schema'
import shipmentStatusChangedExecute from './shipment-status-changed.server'

function ShipmentStatusChangedNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="UPS: Shipment status changed" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const shipmentStatusChangedTrigger = defineTrigger({
  id: 'ups.shipment-status-changed',
  label: 'Shipment status changed',
  description:
    'Fires when a watched UPS shipment gets a new status (delivered, exception, in transit, …).',
  icon,
  color: '#351C15',
  schema: shipmentStatusChangedSchema,
  execute: shipmentStatusChangedExecute,
  config: {
    requiresConnection: true,
    timeout: 30000,
    retries: 0,
    polling: { intervalMinutes: 30, minIntervalMinutes: 15 },
  },
  workflow: {
    node: ShipmentStatusChangedNode,
    panel: ShipmentStatusChangedPanel,
  },
  agent: {
    label: 'UPS shipment status changed',
    description: 'Fires when a watched UPS shipment gets a new status (delivered, exception, …)',
    defaultEnabled: false,
  },
})
