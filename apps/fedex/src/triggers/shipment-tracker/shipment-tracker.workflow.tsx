// src/triggers/shipment-tracker/shipment-tracker.workflow.tsx

import { defineTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import icon from '../../assets/icon.png'
import { ShipmentTrackerPanel } from './shipment-tracker-panel'
import { shipmentTrackerSchema } from './shipment-tracker-schema'
import shipmentTrackerExecute from './shipment-tracker.server'

function ShipmentTrackerNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="FedEx: Track shipment status" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const shipmentTrackerTrigger = defineTrigger({
  id: 'fedex.shipment-tracker',
  label: 'Track shipment status',
  description:
    'Polls a configured set of FedEx shipments (by tracking number or reference) and fires when any of them changes status.',
  icon,
  color: '#4D148C',
  schema: shipmentTrackerSchema,
  execute: shipmentTrackerExecute,
  config: {
    requiresConnection: true,
    timeout: 30000,
    retries: 0,
    polling: { intervalMinutes: 30, minIntervalMinutes: 15 },
  },
  workflow: {
    node: ShipmentTrackerNode,
    panel: ShipmentTrackerPanel,
  },
  // No `agent` surface — agents use fedex.shipment-status-changed.
})
