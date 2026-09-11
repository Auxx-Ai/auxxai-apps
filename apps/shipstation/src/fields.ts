// src/fields.ts

import { defineFields } from '@auxx/sdk/fields'

/**
 * Custom fields the ShipStation app owns, one set per connected ShipStation
 * account (`scope: 'connection'`). Provisioned on `connection-added`, removed
 * on `connection-removed` / uninstall.
 *
 * These land on the NATIVE hidden `shipment` and `parcel` entities added by
 * entity migration 149, not on app-owned entities. The connector runs in
 * contribute mode: every structural value (tracking number, sequence, master
 * flag, weights, dimensions, void state, ship date, carrier, service) is a
 * native system attribute on those defs, and what is left for this app to own
 * is external identity plus a little provenance. See
 * `plans/apps/shipstation/shared-shipment-entities-proposal.md` §5 / §6.
 *
 * Every field here is `creatable: false, updatable: false`: the sink's `sync`
 * session is the only writer, exactly as the Shopify app declares its synced
 * fields. Every field is hidden; these are join keys and provenance, not
 * something a user reads in a panel.
 *
 * ## Why the external ids live here and not as native columns
 *
 * Proposal §5: a per-app external id is namespaced by `appSlug`, so two apps
 * writing the same entity cannot collide on it. A NATIVE id column would have
 * to be claimed by exactly one app, and `shipment` / `parcel` are deliberately
 * multi-writer defs (ShipStation contributes structure, the carrier apps
 * contribute status). Putting `shipmentId` in a native column would make
 * ShipStation the owner of an identity FedEx and UPS also need a place for.
 * The one native column that IS shared is `parcel_tracking_number`, and it is
 * shared precisely because it is the cross-app match key.
 *
 * ## Why `shipmentId` is the shipment's identity, and why the tracking number
 * ## is NOT the parcel's
 *
 * Proposal §8b: ShipStation's parcel identity is `label_id:package_id`, carried
 * in `labelPackageId` below, never the tracking number. That is what makes the
 * owner's "tracking numbers are treated as unique" call safe. Carriers do reuse
 * tracking numbers after long intervals, but ShipStation never mis-merges on a
 * reused number because it does not match on one, so the structural fields
 * (sequence, master flag, weights, dimensions, void state) are never at risk.
 * Only the carrier apps match on `parcel_tracking_number`, and only to write
 * status fields onto a row ShipStation already minted.
 *
 * ## Why the parcel identity is label-scoped
 *
 * Build plan §4: the grain is a package on a PURCHASED LABEL. A void and
 * relabel then reads as history, a second label with its own packages, instead
 * of rewriting the old physical box's row. Probe §2 is the reason this cannot
 * be shortened to the shipment's own package id:
 *
 * - `GET /v2/shipments/{id}` returns package definitions with distinct
 *   `shipment_package_id` values AND the same `package_id: 'se-3'` on every
 *   row, with no tracking numbers at all. Those are a packaging TYPE, not a
 *   box, so they must never be used as parcel identity.
 * - The two arrays must never be joined on `package_id` or on array position.
 *   In the probe's three-box label the master (sequence 1) was returned LAST.
 *
 * Missing label-package ids are a visible source-contract error, not something
 * to paper over with a positional fallback.
 *
 * ## Ids stay strings
 *
 * Never convert an `se-*` identifier to a number. `se-428778294`,
 * `se-197559213` and `se-2943015` are opaque strings; the numeric-looking
 * `package_id` (`158414020`) is kept as a string too so the composed
 * `labelPackageId` is one stable text value.
 */
export const shipstationFields = defineFields([
  // ── shipment ──────────────────────────────────────────────────────────────
  // ShipStation's own shipment id (`se-428778294` in probe §2). THE external
  // id for the shipment: the sink resolves a shipment by this on every sync
  // after the first, and it is mirrored into `RecordIdentity`.
  //
  // Shipment identity and label identity are separate on purpose. Probe §3
  // found one shipment (`se-426507931`) carrying two labels, one voided and
  // one active, both sharing the shipment id and the external shipment id. A
  // label id could not stand in for this, and this could not stand in for a
  // label id.
  {
    key: 'shipmentId',
    type: 'TEXT',
    targetEntity: 'shipment',
    scope: 'connection',
    name: 'ShipStation Shipment ID',
    identity: true,
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  // Which ShipStation store dispatched the shipment (`se-2943015` in probe §2).
  // Retained even when no native order link is found (build plan §5), so a
  // multi-store account can be told apart after the fact.
  {
    key: 'storeId',
    type: 'TEXT',
    targetEntity: 'shipment',
    scope: 'connection',
    name: 'ShipStation Store ID',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  // The raw `external_shipment_id` string, verbatim
  // (`7489518207152-8681743417520`).
  //
  // Stored, not parsed. Probe §2: the two components LOOK like commerce ids but
  // their semantics are unverified, and a fulfillment order id and a
  // fulfillment id are different identifiers. Keeping the raw string means the
  // order-resolution step can be written later against real evidence rather
  // than a guess baked into the schema now.
  {
    key: 'externalShipmentId',
    type: 'TEXT',
    targetEntity: 'shipment',
    scope: 'connection',
    name: 'ShipStation External Shipment ID',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  // The raw `external_order_id` as it appears ON THE LABEL, verbatim.
  //
  // Also stored rather than interpreted. Probe §2 recorded a verified mismatch
  // with the naive reading of the name: the label's `external_order_id`
  // (`17954843328688`) equalled the shipment item's `external_order_item_id`,
  // while the shipment's own `external_order_id` was null. That is evidence
  // against the field name, not proof that either value is a Shopify line id.
  {
    key: 'externalOrderId',
    type: 'TEXT',
    targetEntity: 'shipment',
    scope: 'connection',
    name: 'ShipStation External Order ID',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },

  // ── parcel ────────────────────────────────────────────────────────────────
  // `${label_id}:${package_id}`, e.g. `se-197559213:158414020`. THE external id
  // for the parcel, composed by the connector server and stored as one string.
  //
  // Composed rather than taken from a single source field because ShipStation
  // has no single id at this grain: a label package id is only unique within
  // its label. Label-scoping it is what preserves a void and relabel as
  // history (build plan §4). See the file header for why this and not the
  // tracking number, and why the shipment's `package_id: 'se-3'` is not an
  // option.
  {
    key: 'labelPackageId',
    type: 'TEXT',
    targetEntity: 'parcel',
    scope: 'connection',
    name: 'ShipStation Label Package ID',
    identity: true,
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  // The label this box was printed on (`se-197559213`), kept as its own column
  // rather than left implicit in the composed identity above.
  //
  // There is no native `label` entity and there is not going to be: proposal §6
  // treats a label as a carrier artifact, so a void and reprint is lifecycle on
  // the parcel (`parcel_voided`, `parcel_voided_at`) plus new parcel rows. This
  // field is what still lets the parcels printed on one label be grouped, which
  // is how a replacement label's boxes are told from the voided label's boxes
  // for the same shipment.
  {
    key: 'labelId',
    type: 'TEXT',
    targetEntity: 'parcel',
    scope: 'connection',
    name: 'ShipStation Label ID',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
  // The LABEL's raw `tracking_status`, unnormalized, exactly as the provider
  // said it.
  //
  // PROVENANCE, NOT TRUTH. Probe §3 found this value disagreeing with the
  // carrier: the three-box label reported `tracking_status: 'in_transit'` while
  // `GET /v2/labels/{id}/track` returned `Not Yet In System` (`NY`) with null
  // ship and delivery dates. VOIDED labels also carried
  // `tracking_status: 'in_transit'`. So a label-level status is never a claim
  // that every package on it has that status, and it must not be copied onto
  // each box as if it were per-parcel truth. It is stored unnormalized on
  // purpose, so that a future reader can see what ShipStation actually said
  // rather than what this app decided it meant.
  //
  // The native `parcel_status` (`ParcelTrackingStatus`) is owned by the FedEx
  // and UPS apps, which have no connectors yet, so it stays null in this pass.
  // That is expected, not a gap: proposal §5's ownership split is what keeps
  // two writers off one field, and this app declining to fill `parcel_status`
  // from a label summary is that split being honoured.
  {
    key: 'providerTrackingStatus',
    type: 'TEXT',
    targetEntity: 'parcel',
    scope: 'connection',
    name: 'ShipStation Label Tracking Status',
    capabilities: {
      hidden: true,
      filterable: true,
      sortable: false,
      creatable: false,
      updatable: false,
    },
  },
])
