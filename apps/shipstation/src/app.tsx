// src/app.tsx

/**
 * ShipStation app: shipments, labels, rates and package tracking.
 *
 * Four surfaces:
 *
 * - **Data connector** — syncs shipments and their boxes into the entity
 *   system. See ./shipstation.connector.ts.
 * - **Agent tools** — a small read set plus one write, split across two
 *   toolsets so that looking a shipment up and spending money are separate
 *   grants. See ./tools/toolsets.ts.
 * - **Workflow block** — 7 resources, 23 operations, dispatched through
 *   `blocks/shipstation/shipstation-tool-map.ts` to the internal
 *   `block_shipstation_*` tools registered below. Those internal tools carry
 *   NO `agent` surface, which is what makes 23 operations affordable: a tool
 *   without an agent surface costs an agent nothing.
 * - **Polling triggers** — three deltas over the V2 API. ShipStation has no
 *   proved V2 webhook delivery, so these poll; see ./triggers.
 *
 * This app declares NO `entities` of its own, exactly like Shopify. The
 * connector runs in contribute mode against the two NATIVE hidden entities
 * `shipment` and `parcel` (entity migration 149), which are shared with the
 * carrier apps: ShipStation contributes structure (which boxes belong
 * together, sequence, master flag, weights, dimensions, void state), FedEx and
 * UPS contribute carrier status onto the same parcel row, and no single app
 * owns a parcel. See plans/apps/shipstation/shared-shipment-entities-proposal.md.
 *
 * There is no `label` entity and there will not be one: a label is a carrier
 * artifact, so a void and reprint is lifecycle on the parcel (`parcel_voided`,
 * `parcel_voided_at`) plus new parcel rows, which keeps the old physical box's
 * row as history instead of rewriting it.
 *
 * What this app DOES own is external identity and a little provenance, in
 * connection-scoped fields on those native entities. See ./fields.ts.
 *
 * Every write in the block is gated by the two app settings in
 * ./app.settings.ts, checked in `shipstation.server.ts` as well as in the
 * panel. Both checks are required: the tool map is reachable by Kopilot
 * without the panel ever rendering.
 */

import { TextBlock } from '@auxx/sdk/client'
import { shipstationBlock } from './blocks/shipstation/shipstation.workflow'
import { shipstationFields } from './fields'
import { shipstationConnector } from './shipstation.connector'
import { createShipstationReturnLabelTool } from './tools/create-shipstation-return-label.tool'
import { getShipstationLabelTool } from './tools/get-shipstation-label.tool'
import { getShipstationShipmentPackagesTool } from './tools/get-shipstation-shipment-packages.tool'
import { getShipstationShipmentTool } from './tools/get-shipstation-shipment.tool'
import { getShipstationTrackingTool } from './tools/get-shipstation-tracking.tool'
import { addressValidateTool } from './tools/internal/address-validate.tool'
import { carrierGetManyTool } from './tools/internal/carrier-get-many.tool'
import { carrierGetPackageTypesTool } from './tools/internal/carrier-get-package-types.tool'
import { carrierGetServicesTool } from './tools/internal/carrier-get-services.tool'
import { fulfillmentGetManyTool } from './tools/internal/fulfillment-get-many.tool'
import { labelCreateReturnTool } from './tools/internal/label-create-return.tool'
import { labelCreateTool } from './tools/internal/label-create.tool'
import { labelGetManyTool } from './tools/internal/label-get-many.tool'
import { labelGetTool } from './tools/internal/label-get.tool'
import { labelTrackTool } from './tools/internal/label-track.tool'
import { labelCancelRefundTool } from './tools/internal/label-cancel-refund.tool'
import { labelVoidTool } from './tools/internal/label-void.tool'
import { rateEstimateTool } from './tools/internal/rate-estimate.tool'
import { rateGetForShipmentTool } from './tools/internal/rate-get-for-shipment.tool'
import { rateGetManyTool } from './tools/internal/rate-get-many.tool'
import { shipmentAddNoteTool } from './tools/internal/shipment-add-note.tool'
import { shipmentAddTagTool } from './tools/internal/shipment-add-tag.tool'
import { shipmentCancelTool } from './tools/internal/shipment-cancel.tool'
import { shipmentCreateTool } from './tools/internal/shipment-create.tool'
import { shipmentGetManyTool } from './tools/internal/shipment-get-many.tool'
import { shipmentGetTool } from './tools/internal/shipment-get.tool'
import { shipmentRemoveTagTool } from './tools/internal/shipment-remove-tag.tool'
import { shipmentUpdateTool } from './tools/internal/shipment-update.tool'
import { trackingGetTool } from './tools/internal/tracking-get.tool'
import { listShipstationCarriersTool } from './tools/list-shipstation-carriers.tool'
import { listShipstationLabelsTool } from './tools/list-shipstation-labels.tool'
import { listShipstationShipmentsTool } from './tools/list-shipstation-shipments.tool'
import { shipstationToolsets } from './tools/toolsets'
import { labelChangedTrigger } from './triggers/label-changed/label-changed.workflow'
import { shipmentChangedTrigger } from './triggers/shipment-changed/shipment-changed.workflow'
import { trackingChangedTrigger } from './triggers/tracking-changed/tracking-changed.workflow'

export const app = {
  // Fields the app owns on the native `shipment` / `parcel` entities,
  // provisioned per connected ShipStation account. See ./fields.ts.
  fields: shipstationFields,
  // Data connectors sync external records into the entity system. One
  // connector per app; see ./shipstation.connector.ts.
  dataConnectors: [shipstationConnector],
  workflow: {
    blocks: [shipstationBlock],
    triggers: [shipmentChangedTrigger, labelChangedTrigger, trackingChangedTrigger],
  },
  tools: [
    // ── Agent tools ────────────────────────────────────────────────────────
    // Reads, in the `shipstation.read` toolset.
    listShipstationCarriersTool,
    getShipstationShipmentPackagesTool,
    getShipstationLabelTool,
    listShipstationLabelsTool,
    getShipstationTrackingTool,
    listShipstationShipmentsTool,
    getShipstationShipmentTool,
    // The one agent-facing write, in its own `shipstation.returns` toolset.
    createShipstationReturnLabelTool,

    // ── Internal block-dispatch tools (no agent surface) ────────────────────
    // One per entry in `blocks/shipstation/shipstation-tool-map.ts`. An
    // unregistered id means `ctx.runTool` finds nothing at run time, and
    // nothing at build time catches it, so this list and the tool map must
    // stay the same length.
    shipmentGetManyTool,
    shipmentGetTool,
    shipmentCreateTool,
    shipmentUpdateTool,
    shipmentCancelTool,
    shipmentAddTagTool,
    shipmentRemoveTagTool,
    shipmentAddNoteTool,
    labelGetManyTool,
    labelGetTool,
    labelCreateTool,
    labelVoidTool,
    labelCancelRefundTool,
    labelCreateReturnTool,
    labelTrackTool,
    trackingGetTool,
    rateEstimateTool,
    rateGetManyTool,
    rateGetForShipmentTool,
    carrierGetManyTool,
    carrierGetServicesTool,
    carrierGetPackageTypesTool,
    addressValidateTool,
    fulfillmentGetManyTool,
  ],
  toolsets: shipstationToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">ShipStation</TextBlock>
      <TextBlock align="left">
        Look up shipments, labels and every package tracking number, including the history of voided
        and re-printed labels. A shipment sent as several boxes has a different tracking number per
        box, and this app returns all of them.
      </TextBlock>
      <TextBlock align="left">
        Workflows can also create and update shipments, shop rates, purchase and void labels, and
        issue return labels. Those are off until an admin turns them on in this app's settings.
      </TextBlock>
      <TextBlock align="left">
        Connect with a ShipStation V2 API key from Settings, Account, API Settings in ShipStation.
      </TextBlock>
    </>
  )
}
