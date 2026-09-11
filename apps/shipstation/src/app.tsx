// src/app.tsx

/**
 * ShipStation app: shipment and package tracking visibility.
 *
 * Read-only over the ShipStation V2 API: four tools, plus one data connector
 * that syncs shipments and their boxes into the entity system.
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
 */

import { TextBlock } from '@auxx/sdk/client'
import { shipstationFields } from './fields'
import { shipstationConnector } from './shipstation.connector'
import { getShipstationLabelTool } from './tools/get-shipstation-label.tool'
import { getShipstationShipmentPackagesTool } from './tools/get-shipstation-shipment-packages.tool'
import { listShipstationCarriersTool } from './tools/list-shipstation-carriers.tool'
import { listShipstationLabelsTool } from './tools/list-shipstation-labels.tool'
import { shipstationToolsets } from './tools/toolsets'

export const app = {
  // Fields the app owns on the native `shipment` / `parcel` entities,
  // provisioned per connected ShipStation account. See ./fields.ts.
  fields: shipstationFields,
  // Data connectors sync external records into the entity system. One
  // connector per app; see ./shipstation.connector.ts.
  dataConnectors: [shipstationConnector],
  tools: [
    listShipstationCarriersTool,
    getShipstationShipmentPackagesTool,
    getShipstationLabelTool,
    listShipstationLabelsTool,
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
        Connect with a ShipStation V2 API key from Settings, Account, API Settings in ShipStation.
      </TextBlock>
    </>
  )
}
