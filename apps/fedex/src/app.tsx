// src/app.tsx

/**
 * FedEx app registry — 5 tracking tools (one toolset) + one polling trigger.
 *
 * Agent-first tracking on the free Basic Track API: track shipments by number
 * or reference, watch shipments, and fan out status changes to agents/workflows.
 * No workflow action block in phase 1.
 */

import { TextBlock } from '@auxx/sdk/client'
import { listWatchedShipmentsTool } from './tools/list-watched-shipments.tool'
import { fedexToolsets } from './tools/toolsets'
import { trackByReferenceTool } from './tools/track-by-reference.tool'
import { trackShipmentTool } from './tools/track-shipment.tool'
import { unwatchShipmentTool } from './tools/unwatch-shipment.tool'
import { watchShipmentTool } from './tools/watch-shipment.tool'
import { shipmentStatusChangedTrigger } from './triggers/shipment-status-changed/shipment-status-changed.workflow'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [],
    triggers: [shipmentStatusChangedTrigger],
  },
  tools: [
    trackShipmentTool,
    trackByReferenceTool,
    watchShipmentTool,
    unwatchShipmentTool,
    listWatchedShipmentsTool,
  ],
  toolsets: fedexToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">FedEx</TextBlock>
      <TextBlock align="left">
        Track FedEx shipments from your agents and workflows. Look up live status by tracking number
        or your own reference, watch shipments, and react to status changes (delivered, exception,
        out for delivery). Connect with your FedEx Developer Portal API credentials.
      </TextBlock>
    </>
  )
}
