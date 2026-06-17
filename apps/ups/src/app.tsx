// src/app.tsx

/**
 * UPS app registry.
 *
 * Agent surface: 4 tracking tools (one toolset) + the watch-registry polling
 * trigger (`ups.shipment-status-changed`).
 *
 * Workflow surface: the `ups` action block (track / watch / unwatch, backed by
 * internal block tools) + the workflow-native `ups.shipment-tracker` trigger,
 * which is configured from its own panel rather than the agent watch registry.
 */

import { TextBlock } from '@auxx/sdk/client'
import { upsBlock } from './blocks/ups/ups.workflow'
import { listWatchedShipmentsTool } from './tools/list-watched-shipments.tool'
import { trackShipmentTool } from './tools/track-shipment.tool'
import { unwatchShipmentTool } from './tools/unwatch-shipment.tool'
import { upsBlockTrackTool } from './tools/ups-block-track.tool'
import { upsBlockWatchTool } from './tools/ups-block-watch.tool'
import { upsBlockUnwatchTool } from './tools/ups-block-unwatch.tool'
import { upsToolsets } from './tools/toolsets'
import { watchShipmentTool } from './tools/watch-shipment.tool'
import { shipmentStatusChangedTrigger } from './triggers/shipment-status-changed/shipment-status-changed.workflow'
import { shipmentTrackerTrigger } from './triggers/shipment-tracker/shipment-tracker.workflow'

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
    blocks: [upsBlock],
    triggers: [shipmentStatusChangedTrigger, shipmentTrackerTrigger],
  },
  tools: [
    // Agent tools
    trackShipmentTool,
    watchShipmentTool,
    unwatchShipmentTool,
    listWatchedShipmentsTool,
    // Internal-only block-dispatch tools (no agent surface)
    upsBlockTrackTool,
    upsBlockWatchTool,
    upsBlockUnwatchTool,
  ],
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
