// src/blocks/shipstation/shipstation-tool-map.ts

/**
 * Dispatch table: `${resource}.${operation}` from the block schema to the id of
 * the internal tool that executes it.
 *
 * Lives in a plain `.ts` (not the `.workflow.tsx`) so the server-side
 * dispatcher can import it without dragging in the React/client surface. The
 * build extractor reads this literal at compile time and projects it into the
 * catalog envelope so the runtime can validate dispatches.
 *
 * 🛑 Every pair here is reachable by Kopilot WITHOUT the panel rendering. That
 * is why `shipstation.server.ts` checks capabilities as well as structural
 * validity: gating only the picker would leave every write callable by an agent.
 */

export const shipstationToolMap = {
  // shipment
  'shipment.getMany': 'block_shipstation_shipment_get_many',
  'shipment.get': 'block_shipstation_shipment_get',
  'shipment.create': 'block_shipstation_shipment_create',
  'shipment.update': 'block_shipstation_shipment_update',
  'shipment.cancel': 'block_shipstation_shipment_cancel',
  'shipment.addTag': 'block_shipstation_shipment_add_tag',
  'shipment.removeTag': 'block_shipstation_shipment_remove_tag',
  'shipment.addNote': 'block_shipstation_shipment_add_note',
  // label
  'label.getMany': 'block_shipstation_label_get_many',
  'label.get': 'block_shipstation_label_get',
  'label.create': 'block_shipstation_label_create',
  'label.void': 'block_shipstation_label_void',
  'label.cancelRefund': 'block_shipstation_label_cancel_refund',
  'label.createReturn': 'block_shipstation_label_create_return',
  'label.track': 'block_shipstation_label_track',
  // tracking
  'tracking.get': 'block_shipstation_tracking_get',
  // rate
  'rate.estimate': 'block_shipstation_rate_estimate',
  'rate.getMany': 'block_shipstation_rate_get_many',
  'rate.getForShipment': 'block_shipstation_rate_get_for_shipment',
  // carrier
  'carrier.getMany': 'block_shipstation_carrier_get_many',
  'carrier.getServices': 'block_shipstation_carrier_get_services',
  'carrier.getPackageTypes': 'block_shipstation_carrier_get_package_types',
  // address
  'address.validate': 'block_shipstation_address_validate',
  // fulfillment
  'fulfillment.getMany': 'block_shipstation_fulfillment_get_many',
} as const

export type ShipstationToolMap = typeof shipstationToolMap
