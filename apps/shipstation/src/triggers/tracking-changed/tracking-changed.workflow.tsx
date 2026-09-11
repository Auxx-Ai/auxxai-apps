// src/triggers/tracking-changed/tracking-changed.workflow.tsx

import { defineTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import icon from '../../assets/icon.png'
import { TrackingChangedPanel } from './tracking-changed-panel'
import { trackingChangedSchema } from './tracking-changed-schema'
import trackingChangedExecute from './tracking-changed.server'

function TrackingChangedNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="ShipStation: Parcel status changed" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

/**
 * Polling trigger over `GET /v2/tracking` for a configured set of parcels.
 *
 * `config.polling` is what makes this a polling trigger; the interval selector
 * is rendered by the platform, not by the panel.
 */
export const trackingChangedTrigger = defineTrigger({
  id: 'shipstation.tracking-changed',
  label: 'Parcel status changed',
  description:
    'Polls a configured set of parcels through ShipStation carrier tracking and fires when one changes status. Delivered and returned parcels stop being polled. The first poll records the current status of each parcel without firing.',
  icon,
  color: '#0B5FFF',
  schema: trackingChangedSchema,
  execute: trackingChangedExecute,
  config: {
    requiresConnection: true,
    timeout: 30000,
    retries: 0,
    polling: { intervalMinutes: 30, minIntervalMinutes: 15 },
  },
  workflow: {
    node: TrackingChangedNode,
    panel: TrackingChangedPanel,
  },
})
