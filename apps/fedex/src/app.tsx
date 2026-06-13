// src/app.tsx

/**
 * FedEx app registry.
 *
 * Agent surface: 5 tracking tools (one toolset) + the watch-registry polling
 * trigger (`fedex.shipment-status-changed`).
 *
 * Workflow surface: the `fedex` action block (track / track-by-reference /
 * watch / unwatch, backed by internal block tools) + the workflow-native
 * `fedex.shipment-tracker` trigger, which is configured from its own panel
 * rather than the agent watch registry.
 */

import { TextBlock } from '@auxx/sdk/client'
import { fedexBlock } from './blocks/fedex/fedex.workflow'
import { fedexBlockTrackTool } from './tools/fedex-block-track.tool'
import { fedexBlockTrackByReferenceTool } from './tools/fedex-block-track-by-reference.tool'
import { fedexBlockWatchTool } from './tools/fedex-block-watch.tool'
import { fedexBlockUnwatchTool } from './tools/fedex-block-unwatch.tool'
import { listWatchedShipmentsTool } from './tools/list-watched-shipments.tool'
import { fedexToolsets } from './tools/toolsets'
import { trackByReferenceTool } from './tools/track-by-reference.tool'
import { trackShipmentTool } from './tools/track-shipment.tool'
import { unwatchShipmentTool } from './tools/unwatch-shipment.tool'
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
    blocks: [fedexBlock],
    triggers: [shipmentStatusChangedTrigger, shipmentTrackerTrigger],
  },
  tools: [
    // Agent tools
    trackShipmentTool,
    trackByReferenceTool,
    watchShipmentTool,
    unwatchShipmentTool,
    listWatchedShipmentsTool,
    // Internal-only block-dispatch tools (no agent surface)
    fedexBlockTrackTool,
    fedexBlockTrackByReferenceTool,
    fedexBlockWatchTool,
    fedexBlockUnwatchTool,
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
