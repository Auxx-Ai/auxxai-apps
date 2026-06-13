// src/app.tsx

/**
 * UPS app registry — 4 tracking tools (one toolset) + one polling trigger.
 *
 * Agent-first tracking on the free Tracking v1 API: track shipments by number,
 * watch shipments, and fan out status changes to agents/workflows. No workflow
 * action block in phase 1.
 */

import { TextBlock } from '@auxx/sdk/client'
import { listWatchedShipmentsTool } from './tools/list-watched-shipments.tool'
import { trackShipmentTool } from './tools/track-shipment.tool'
import { unwatchShipmentTool } from './tools/unwatch-shipment.tool'
import { upsToolsets } from './tools/toolsets'
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
  tools: [trackShipmentTool, watchShipmentTool, unwatchShipmentTool, listWatchedShipmentsTool],
  toolsets: upsToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">UPS</TextBlock>
      <TextBlock align="left">
        Track UPS shipments from your agents and workflows. Look up live status, scans, ETA and
        proof of delivery by tracking number, watch shipments, and react to status changes
        (delivered, exception, …). Connect your UPS account — you sign in on UPS, we never see your
        credentials.
      </TextBlock>
    </>
  )
}
