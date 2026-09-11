// src/shipstation.connector.ts
//
// The single ShipStation data connector. TWO streams.
//
// `label` is the grain: every record is one ShipStation LABEL, fanned out onto
// two NATIVE hidden entities:
//   • the label root  -> contributing native `shipment`
//   • `packages[]`    -> contributing native `parcel`, hung off the shipment
//                        through the system edge `system:shipment_parcels`.
//
// `shipment` is a narrow ENRICHMENT of the same `shipment` rows, carrying the
// two values that live on the shipment resource and appear on no label
// (`shipment_number`, `store_id`). Its field set is strictly disjoint from the
// label stream's — see the rule for the next contributor below, which applies to
// this connector's own two streams just as much as to another app.
//
// Like Shopify, this app declares NO entities at all. Every column below is
// either a native system attribute (`target`) or a `defineFields` app field
// (`appField`, see `fields.ts`), which is namespaced by app slug and therefore
// cannot collide with another app's id for the same row.
//
// ⚠️ This SUPERSEDES build plan §4 and its `shipments` / `labels` / `packages`
// app-owned entities, and the illustrative mapping block in §5 that used them.
// The replacement is `plans/apps/shipstation/shared-shipment-entities-proposal.md`:
// two native, hidden (`isVisible: false`) entity kinds, `shipment` and `parcel`,
// landed by entity migration `149-shipment-parcel` and admitted to the SDK's
// `EntityRefKind` union, that SEVERAL apps write into. There is deliberately no
// `label` entity: a label is a carrier artifact, not a universal concept, so a
// void-and-reprint becomes `parcel_voided` / `parcel_voided_at` plus new parcel
// rows, and the relabel history survives without one (proposal §6).
//
// ── Why native, and the ownership split that makes it safe ───────────────────
// Three apps know different things about the same box. ShipStation knows what
// was dispatched (which boxes belong together, weights, dimensions, void and
// relabel history); FedEx and UPS know where each box is (status, scans,
// delivery); Shopify knows which order it belongs to. App-owned entities would
// give each of them its own table with no way to join a ShipStation box to the
// FedEx status of that same box (proposal §2).
//
// ShipStation owns STRUCTURE, the carrier apps own STATUS. Those two field sets
// are disjoint on the same row, and a parcel has exactly one carrier, so FedEx
// and UPS write disjoint sets of ROWS and never touch each other (proposal §5).
// That is what makes multi-app contribution safe here, and it is load-bearing
// rather than a convention. See the `mergeStrategy` note on the shipment mapping
// for the rule any later contributor has to follow.
//
// ── What is NOT proved ───────────────────────────────────────────────────────
// The live probe (`plans/apps/shipstation/api-probe-2026-09-10.md`) proved the
// shipment delta query is ACCEPTED (HTTP 200 with plausible rows). It did NOT
// prove boundary inclusivity, tie handling at a window edge, pagination
// stability under concurrent updates, or that a label void bumps its parent
// shipment's `modified_at`. Nothing here assumes any of those: every window
// start is inclusive and re-reads its own boundary, subdivided windows abut
// rather than gap, and the void half of the label delta is keyed on `voided_at`
// rather than on any shipment-level timestamp.
//
// ⚠️ Any field whose projected value is an ARRAY or an OBJECT is silently
// dropped by the fan-out before it reaches the field-value layer, unless it
// targets a JSON field. Every binding here is a scalar.

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import { z } from '@auxx/sdk/tools'
import shipstationSync from './shipstation.connector.server'

export const shipstationConnector = defineDataConnector({
  id: 'shipstation',
  label: 'ShipStation',
  description:
    'Sync shipments and every package tracking number from ShipStation, including voided and re-printed labels.',
  requiresConnection: true,
  iconKey: 'package',
  config: z.object({
    // The FIXED start of the import window, and the only reason this connector
    // can use a snapshot mode at all (build plan §5). It is a floor that never
    // moves: a cutoff that crept forward would silently abandon labels already
    // imported, and a void arriving on one of them would then never be seen.
    // The provider reported 4,290 labels with the oldest observed at
    // 2025-10-20, so this bounds the crawl to history the merchant cares about
    // rather than to whatever the API still serves.
    // `z.iso.datetime()`, not a bare `z.string()`. It emits
    // `format: 'date-time'` into the extracted JSON Schema, which is what lets
    // the platform render a datetime picker instead of a free-text box: a
    // required text field with no validation accepts "last week" at save time
    // and only fails when the sync runs.
    importStart: z.iso
      .datetime()
      .describe(
        'Import labels created on or after this date. Fixed, not a moving cutoff: every run re-reads this whole window.'
      ),
  }),
  // No connector-level `webhookTrigger`. `GET /v2/environment/webhooks` returned
  // an empty list on the probe and no V2 event contract, signature scheme or
  // delivery behaviour was verified. V1 `SHIP_NOTIFY` must not be assumed to
  // work with a V2 key (build plan §5), so scheduled sync is the only driver
  // until that is proved. Webhooks are an acceleration, never the truth source.
  streams: [
    // ── label ───────────────────────────────────────────────────────────────
    // One record per ShipStation LABEL. The label, not the shipment, is the
    // fetch grain because the label is the only object that carries package
    // tracking numbers: the shipment's own package definitions have distinct
    // `shipment_package_id`s, the SAME `package_id` on every row, and NO
    // tracking number at all (probe §2). Never join the two arrays on
    // `package_id` or on array position.
    {
      key: 'label',
      // INCREMENTAL, on TWO cursors. This was a snapshot until the delta below
      // was implemented, and the history matters because the reasoning is easy
      // to re-derive wrongly.
      //
      // ── Why it was a snapshot ────────────────────────────────────────────
      //   1. `created_at_start` / `created_at_end` are the only date filters
      //      `/v2/labels` has. There is no label modified-time filter at all.
      //   2. A new-labels-only watermark would therefore never see a VOID on an
      //      old label, which is the single most important state change this
      //      connector exists to carry. The probe found 117 voided labels in the
      //      account; a delta keyed on creation time sees none of them change.
      //   3. Whether a label change advances its parent shipment's
      //      `modified_at` is explicitly unproved, so a shipment-level delta
      //      cannot stand in for one either.
      //
      // Point 2 is the one that mattered, and it is the one the second cursor
      // removes. Points 1 and 3 still stand and are still why the obvious delta
      // is not the one implemented.
      //
      // ── 🛑 The delta that CANNOT be written ──────────────────────────────
      // `sort_by=modified_at` is accepted on `/v2/labels`, but `modified_at` is
      // NOT a field the label response returns — the V2 schema has no such
      // property on a label, and every documented example carries `created_at`,
      // `voided` and `voided_at` instead. So "sort by modified_at descending and
      // stop at the watermark" cannot be written: the stop value is a field the
      // API sorts on and never hands back. Do not reach for it.
      //
      // ── The delta that IS written ────────────────────────────────────────
      //   • NEW LABELS: `created_at_start=<created watermark>`,
      //     `sort_by=created_at`, ascending, over frozen, subdividable windows.
      //   • VOIDS: `label_status=voided`, `sort_by=voided_at`, DESCENDING,
      //     stopping at the first label whose `voided_at` is at or before the
      //     void watermark. `voided_at` IS returned and IS a legal `sort_by`,
      //     which is the whole reason this half is possible.
      //
      // The two watermarks are carried in the single string the platform
      // persists per stream; `encodeLabelWatermark` in the server module
      // explains why a lexical max over that encoding is the right fold rather
      // than a lucky one. Each half advances ONLY when its own sweep has been
      // crawled to exhaustion, so a sweep that errors or runs out of page budget
      // leaves both floors where they were.
      //
      // The residual gap is a label change that is neither a creation nor a
      // void, principally `tracking_status` drift.
      //
      // ⚠️ That gap got expensive on 2026-09-11. It was an accepted loss while
      // `tracking_status` was provenance only; it now decides `shipment_status`
      // (status plan §3), so a shipment's status freezes at whatever the label
      // said when its creation was first read. No third sweep can close it,
      // because `/v2/labels` has no modified-time filter and never returns a
      // modified time. The fix is the per-box tracking stream in status plan §6,
      // which outranks this value at rung 1 of the ladder.
      //
      // Measured before the switch (build plan §9): 141 labels over 10 days in
      // 76s steady state, extrapolating to 35-40 minutes per cycle over ~4,290
      // labels and growing with history forever. Nothing was broken; it was just
      // expensive.
      syncMode: 'incremental',
      mappings: [
        // ── label root -> native shipment ────────────────────────────────────
        {
          rootPath: '',
          target: { entityKind: 'shipment' },
          // 🛑 `ignore`, NEVER `archive` or `mark_deleted` (build plan §5). A
          // filtered or partial scan is not deletion evidence: this crawl is
          // bounded by `importStart`, so "not returned" legitimately means
          // "outside the window", "on a page we have not reached yet", or
          // "expired from the provider's visible history" far more often than
          // it means "gone". Voided labels are INCLUDED in the crawl and their
          // void state is mapped explicitly onto the parcels below, so absence
          // from a page is never read as a void. There is exactly one way a
          // parcel becomes voided here, and it is an explicit field.
          //
          // ⚠️ Kept DECLARED even though the stream is now `incremental`, where
          // the platform ignores it outright ("absence means unchanged, not
          // deleted"). It is the answer if this stream ever goes back to a
          // snapshot, and the reasoning above is what a future reader would
          // otherwise have to reconstruct.
          orphanBehavior: 'ignore',
          // ── mergeStrategy: none, and here is why ──────────────────────────
          // Every binding below takes the default `overwrite`, deliberately.
          // ShipStation owns structure and the carrier apps own status, and the
          // two sets are disjoint (proposal §5), so no field on either def has
          // two `overwrite` writers and the mutual-drift ping-pong in proposal
          // §4 cannot start. Nothing needs `fill_blank` to protect it, because
          // nothing else writes it.
          //
          // 🛑 THE RULE FOR THE NEXT CONTRIBUTOR: anything that later writes a
          // field this connector owns MUST take `fill_blank`,
          // `connector_owned_only` or `ignore`, or route its value to its own
          // namespaced app field instead. Two `overwrite` writers on one field
          // each see the other's `FieldValue.managedByConnectorId` as drift, so
          // the content-hash skip never fires and both rewrite and re-stamp the
          // cell on every run, forever. Nothing errors. Nothing logs. The only
          // symptom is churn.
          fields: [
            // Identity. `shipmentId` is declared `identity: true` in fields.ts,
            // so this binding auto-stamps `identityRole: { kind: 'externalId' }`
            // and the DESIGNATED external id wins over the record-level
            // `externalId` hint (which is the LABEL id) for this mapping.
            //
            // ⚠️ That is the mechanism behind the two-labels-one-shipment case
            // below: both records designate the same `shipmentId`, so both land
            // on the same shipment row.
            { sourcePath: 'shipmentId', appField: 'shipmentId' },
            // NOT bound here: `storeId`. It is on the SHIPMENT resource and on
            // no label (the `shipment` object a label carries is `writeOnly` in
            // the V2 schema, so it never comes back on a read), which is why
            // build plan §9 recorded it as empty. The `shipment` stream below
            // owns it now, and owning it in exactly one place is what keeps two
            // mappings of this connector off one cell.
            //
            // Per-app external ids stay in APP fields (proposal §6). They are
            // deliberately not native columns: a native id column would have to
            // be claimed by one app, and it would still be useless as a
            // cross-app join key, because `match` cannot bind an `appField` at
            // all (proposal §4).
            //
            // ⚠️ `externalShipmentId` looks like two commerce ids joined by a
            // hyphen (`7489518207152-8681743417520`) and its semantics are
            // UNVERIFIED. Do not parse it. A fulfillment order id and a
            // fulfillment id are different identifiers, and one sample is not a
            // contract (probe §2, build plan §6 step 2). Carried raw so a later
            // resolver has the original string to validate against Shopify.
            { sourcePath: 'externalShipmentId', appField: 'externalShipmentId' },
            // ⚠️ Named `external_order_id` by the provider, but in the probe's
            // sample it equalled the shipment ITEM's `external_order_item_id`,
            // not an order id. A verified mismatch with the naive reading of
            // the field name, and not yet proof that it equals a Shopify line
            // id either. Same rule: carried raw, never parsed.
            { sourcePath: 'externalOrderId', appField: 'externalOrderId' },

            // Native structural columns. ShipStation is the sole writer.
            //
            // ⚠️ `shipment_number` is NOT among them any more. Same reason as
            // `storeId` above: it lives on the shipment resource, the label
            // payload has no such property, and it was empty on 135 of 135
            // shipments in the first real sync. The `shipment` stream binds it.
            { sourcePath: 'carrier', target: 'shipment_carrier' },
            { sourcePath: 'service', target: 'shipment_service' },
            // ⚠️ The shipment and its label DISAGREE on this date: the probe saw
            // `2026-09-10T00:00:00Z` on the shipment against
            // `2026-09-10T07:00:00Z` on the label, and did not establish the
            // timezone contract. The server emits the LABEL's value, since the
            // label is this stream's grain. This never replaces the accounting
            // fulfillment date on the order, which is a different fact with a
            // different writer.
            { sourcePath: 'shipDate', target: 'shipment_ship_date' },
            // Multi-box is the common case, not the edge: 34 of the 50 labels
            // sampled carried more than one package, up to ten (probe §1).
            { sourcePath: 'parcelCount', target: 'shipment_parcel_count' },
            // ⚠️ ALREADY NORMALIZED by the server, into the platform's
            // `ShipmentStatus` enum. A `ConnectorMapping` field is a
            // `sourcePath` to `target` binding with NO transform hook, so
            // normalization cannot happen here and has to happen in
            // `shipstation.connector.server.ts` (proposal §8d).
            //
            // The value comes off the four-rung ladder in `deriveShipmentStatus`
            // (status plan §3.1): per-box status where any box has one, else the
            // LIVE label's `tracking_status` normalized, else `label_created`,
            // else `unknown`. Until 2026-09-11 it was derived from the label
            // LIFECYCLE alone, so all 135 shipments read `label_created` while
            // ShipStation was reporting 57 of them delivered.
            //
            // 🛑 An unenumerated provider value falls to `label_created`, NEVER
            // to `unknown`. Our enum has `unknown` as a member and writing it
            // would erase a fact we hold, that a label was printed. `unknown` is
            // reserved for the shipment with no live label at all. Enumerate new
            // provider values from a live payload, never from vendor docs.
            //
            // The provider's own `shipment_status` is not bound and is not even
            // sent on a label payload: it was a label-lifecycle value, never a
            // transit one.
            { sourcePath: 'shipmentStatus', target: 'shipment_status' },
            // The shipment's display name, and its PRIMARY DISPLAY FIELD.
            // Denormalized off the label's master parcel by the server, because
            // `computeDisplayValue` reads a field on the shipment ROW and a
            // tracking number otherwise lives only on a `parcel`.
            // `shipment_number` cannot do this job: it is not on the label
            // payload at all, which is exactly why it is not the display field.
            //
            // ⚠️ This is the ONE shipment-level value a VOIDED label also emits,
            // and that is the voided-master fallback build plan §9 listed as
            // owed: a shipment whose every label is voided (1 of 135 live) was
            // rendering nameless. `projectLabelRecord`'s doc comment carries the
            // ordering argument for why that does not reopen the race the
            // non-voided filter exists to close.
            //
            // 🛑 No `match`, for the same reason as `parcel_tracking_number` and
            // one more: this value CHANGES when a label is voided and reprinted.
            { sourcePath: 'masterTrackingNumber', target: 'shipment_master_tracking_number' },

            // ── label money and documents (status plan §7) ──────────────────
            // All four are LABEL-level values on NATIVE fields, so they bind by
            // `target` rather than `appField`, and all four are emitted from the
            // LIVE label only. That is the same rule as the structural fields
            // above and it is also right on its own terms: voiding refunds the
            // label, so the reprint is what was paid for and what gets printed.
            //
            // 🛑 CURRENCY IS INTEGER MINOR UNITS. The provider sends
            // `{"currency":"usd","amount":16.54}`, a decimal, and there is no
            // transform hook here, so the server multiplies and ROUNDS before it
            // emits: `74.1 * 100` is `7409.999999999999` in binary floating
            // point, so a truncating conversion loses a cent on a real amount
            // from this account. That is what the `Minor` suffix on the source
            // key means, and binding a raw decimal here would store 16 cents.
            { sourcePath: 'costMinor', target: 'shipment_cost' },
            // 0 on all 50 probed labels: this merchant insures nothing, so a
            // zero here is a real reading rather than a missing value.
            { sourcePath: 'insuranceCostMinor', target: 'shipment_insurance_cost' },
            // 🛑 A BEARER SECRET. Verified 2026-09-11: the URL fetches
            // UNAUTHENTICATED and the PDF carries the customer's name and
            // address, so the opaque path segment is the only thing protecting
            // it. Never export it, log it, or put it in a webhook payload. Read
            // off `label_download.pdf`; that object also carries png and zpl.
            { sourcePath: 'labelUrl', target: 'shipment_label_url' },
            // ⚠️ Null on all 50 probed labels, so its WIRE SHAPE IS UNKNOWN, and
            // the field is forward-looking by owner decision rather than
            // evidenced. The server writes it only when the provider sends a
            // string, and warns otherwise instead of serialising a structure
            // into a text column.
            { sourcePath: 'insuranceClaim', target: 'shipment_insurance_claim' },

            // NOT bound here, and each for a reason:
            //
            // • `labelVoided` / `labelVoidedAt` are LABEL lifecycle, and a
            //   shipment can carry two labels at once (see below), so there is
            //   no honest shipment-level answer. The void lands per box, on the
            //   parcel rows, where the fact actually is.
            // • `shipment_order` is declared on the registry def but cannot be
            //   populated by a reference mapping from here: `linkMode:
            //   'reference'` cannot cross connectors, because `findItemByDef`
            //   filters `dataConnectorId` with hard equality, so a ShipStation
            //   reference to a Shopify-created order resolves nothing and is
            //   pushed back onto `stillPending` and retried every run forever
            //   (proposal §4). Populating it needs the platform-side resolver in
            //   build plan §6. It does not block anything here: the parcel data
            //   is useful before any order is matched.
          ],
        },

        // ── packages[] -> native parcel ──────────────────────────────────────
        // One physical box with one tracking number, which is the grain a
        // customer actually asks about. Shopify has no parcel concept at all
        // (`Fulfillment.trackingInfo` is a bare list of `{ company, number, url
        // }` with no per-box identity, sequence, weight or status), so this is
        // the gap ShipStation fills and the reason the box is a row rather than
        // a repeated column (proposal §6).
        //
        // The parent is derived from the longest boundary prefix, which is the
        // root mapping above, so no `parentRootPath` is needed. The edge is a
        // pre-existing SYSTEM relationship field on the shipment def, so nothing
        // is provisioned for it; the resolver resolves the key against the
        // PARENT def, which is why it is `system:shipment_parcels` (on
        // `shipment`) and not `system:parcel_shipment`.
        {
          rootPath: 'packages[]',
          relationshipFieldKey: 'system:shipment_parcels',
          target: { entityKind: 'parcel' },
          // 🛑 `ignore`, for the same reason as the root mapping, plus one of
          // its own: a relabel MINTS new parcel rows and leaves the old ones
          // standing as voided. That is how relabel history survives without a
          // `label` entity, and archiving or flagging the superseded boxes on
          // the grounds that a later page did not return them would destroy
          // exactly the history this design keeps on purpose.
          orphanBehavior: 'ignore',
          fields: [
            // Identity: `${labelId}:${packageId}`, e.g.
            // `se-197559213:158414020`. `labelPackageId` is declared
            // `identity: true` in fields.ts, so this auto-stamps the external
            // id role for the subtree.
            //
            // ⚠️ It is the LABEL package id, never the SHIPMENT package id.
            // The two are different keyspaces: `GET /v2/shipments/<id>` returns
            // three package definitions with distinct `shipment_package_id`s,
            // the same `package_id: 'se-3'` on every one of them, and no
            // tracking number; `GET /v2/labels/<id>` returns the numeric
            // label-package ids and the tracking numbers (probe §2).
            { sourcePath: 'packageKey', appField: 'labelPackageId' },
            // Which label minted this box. Kept because the parcel outlives its
            // label: a voided label's boxes stay as voided parcel rows, and
            // this is what says which print they came from.
            { sourcePath: 'labelId', appField: 'labelId' },

            // 🛑🛑 THE MOST IMPORTANT LINE IN THIS FILE: `parcel_tracking_number`
            // gets NO `match`, and adding one would be a data-corruption bug.
            //
            // ShipStation MINTS parcels. Its parcel identity is the
            // `labelPackageId` external id directly above, which is its own and
            // is never reused. Only the CARRIER apps (FedEx and UPS, neither of
            // which has a connector yet) match on the tracking number, and they
            // mint nothing: they match an existing row and write status onto it.
            //
            // Why a `match: true` here would be actively harmful, in order:
            //
            //   1. Carriers DO reuse tracking numbers after long intervals. The
            //      FedEx app already accepts `shipDateBegin` / `shipDateEnd`
            //      specifically to disambiguate reused ones. Tracking numbers
            //      are treated as unique by owner's decision (proposal §8b) and
            //      that decision was made on the basis that ShipStation is
            //      UNAFFECTED, precisely because it does not match on the
            //      number. This line is what makes that true.
            //   2. Match candidates are OR'd, not ANDed (proposal §8a, settled
            //      by reading `lookup-entities-by-field-value.ts`; the
            //      `IdentityRole` docblock claiming otherwise is wrong). So an
            //      extra match key only ever WIDENS a match. It is not a guard,
            //      it is another independent chance to collide, and a composite
            //      key such as "this number AND this ship date" is unavailable
            //      to a connector at all.
            //   3. The concrete failure: a new box whose number an old, long
            //      since delivered parcel happens to reuse would MERGE onto that
            //      old row, overwriting its sequence, master flag, weight,
            //      dimensions and void state with this label's. The structural
            //      history of both shipments would be silently wrong.
            //   4. Ambiguity is not an error on this path. `lookupByField` runs
            //      under `onAmbiguous: 'first'`, so a collision does not fail
            //      the sync loudly; it takes the first hit and files a
            //      `DuplicateSuggestion`.
            //
            // The field is NATIVE rather than an app field only so the carrier
            // apps can match on it: `buildContributingMatchBindings` binds a
            // native `target` column and never an `appField`.
            { sourcePath: 'trackingNumber', target: 'parcel_tracking_number' },

            // ⚠️ Use `sequence` for presentation, never array position. The
            // probe's three-box label returned its packages in sequence order
            // 3, 2, 1, and the MASTER (sequence 1) was returned LAST. There were
            // three distinct tracking numbers, not a master plus three children.
            { sourcePath: 'sequence', target: 'parcel_sequence' },
            { sourcePath: 'isMaster', target: 'parcel_is_master' },

            // ⚠️ ShipStation reports weight in OUNCES (the three-box label
            // reported 1280, 464 and 704). The unit is not decorative and the
            // number is meaningless without it: a reader who assumes pounds is
            // off by a factor of sixteen.
            { sourcePath: 'weight', target: 'parcel_weight' },
            { sourcePath: 'weightUnit', target: 'parcel_weight_unit' },
            // Inches in the probe (26 x 50 x 4, 96 x 4 x 4, 71 x 6 x 13), but
            // carried rather than assumed, same as the weight unit.
            { sourcePath: 'length', target: 'parcel_length' },
            { sourcePath: 'width', target: 'parcel_width' },
            { sourcePath: 'height', target: 'parcel_height' },
            { sourcePath: 'dimUnit', target: 'parcel_dim_unit' },

            // Label lifecycle, NOT transit state, and the two must be preserved
            // independently: the probe found VOIDED labels still carrying a
            // `tracking_status` of `in_transit`, so a carrier's status says
            // nothing about whether the label is live (probe §3). A voided
            // parcel is excluded from the shipment status roll-up entirely.
            //
            // This is also the reason `orphanBehavior` above can be `ignore`
            // without losing anything: a void is an explicit mapped field, so
            // the crawl never has to infer one from absence.
            { sourcePath: 'voided', target: 'parcel_voided' },
            { sourcePath: 'voidedAt', target: 'parcel_voided_at' },

            // ⚠️ SOURCED FROM THE PACKAGE, WRITTEN BY THE LABEL. The provider's
            // raw, unnormalized tracking status is a LABEL-level value, but a
            // field's `sourcePath` is strictly relative to its mapping's
            // `rootPath` (the SDK contract, and `joinSourcePath` in
            // `app-catalog.ts` simply concatenates the two), so a parent-scoped
            // path is not reachable from inside `packages[]`. The server
            // therefore COPIES the label's `providerTrackingStatus` onto every
            // package it emits, and this binding reads that copy.
            //
            // It is kept raw and in an APP field on purpose, beside the
            // normalized `parcel_status` that the carrier apps will own. That
            // keeps the normalization auditable, and it keeps ShipStation out of
            // a field it does not own: `parcel_status` is the carrier's, and
            // writing it from here would put two `overwrite` writers on one cell
            // the moment FedEx or UPS ships.
            //
            // ⚠️ It is also not evidence of per-box delivery. The three-box
            // label read `in_transit` while `/v2/labels/<id>/track` returned
            // `NY` / `Not Yet In System` with null ship and delivery dates, for
            // the MASTER number only. Never copy a master's status onto every
            // package.
            { sourcePath: 'providerTrackingStatus', appField: 'providerTrackingStatus' },
          ],
        },
      ],

      // ── exampleRecord ─────────────────────────────────────────────────────
      // The probe's real three-box case (`plans/apps/shipstation/api-probe-2026-09-10.md`
      // §2), reproduced rather than invented, because the two things most likely
      // to be got wrong are both visible in it: the packages arrive in sequence
      // order 3, 2, 1, and the MASTER is the LAST element of the array. Tracking
      // numbers are obviously fake; the probe only ever printed SHA-256
      // fingerprints and no real number was recorded anywhere.
      //
      // ⚠️ THE OTHER FIXTURE, not representable in a single example record: a
      // VOID AND REPLACEMENT (probe §3). Shipment `se-426507931` carries TWO
      // labels, `se-196479007` (created 2026-09-08T22:50:32.873Z, voided
      // 2026-09-08T22:52:25.177Z) and `se-196479653` (created
      // 2026-09-08T22:52:48.923Z, active). They share a shipment id AND an
      // external shipment id, with different tracking numbers.
      //
      // That produces TWO records on this stream, and both designate the SAME
      // `shipmentId`, so both land on the SAME shipment row while each
      // contributes its own parcels (the voided label's boxes as voided parcels,
      // the replacement's as active ones). This is what the entity split is for:
      // shipment identity and label identity are not the same thing.
      //
      // 🛑 The consequence, and the reason it matters here: a voided label's
      // page would otherwise rewrite the shipment's structural fields, and which
      // of the two wins within one run is ordering-dependent. The server
      // therefore emits shipment structure ONLY from non-voided labels. The
      // voided label still emits its parcels, so the void history is kept.
      //
      // The single exception is `masterTrackingNumber`, which a voided label DOES
      // emit so that an all-voided shipment has a name. The crawl is
      // `created_at` ascending and ShipStation allows one live label per
      // shipment, so a replacement is always read after the label it replaced,
      // and the live master lands last. See `projectLabelRecord`.
      exampleRecord: {
        labelId: 'se-197559213',
        shipmentId: 'se-428778294',
        // ⚠️ Shown because the projection still emits these two keys, NOT because
        // a label read carries them. The V2 label object has no `shipment_number`
        // and no `store_id`, and the `shipment` it does declare is `writeOnly`, so
        // in production both arrive null and both are bound by the `shipment`
        // stream instead. Neither is bound on this stream any more.
        shipmentNumber: '14530',
        storeId: 'se-2943015',
        externalShipmentId: '7489518207152-8681743417520',
        externalOrderId: '17954843328688',
        carrier: 'fedex',
        service: 'fedex_home_delivery',
        // The LABEL's ship date. The shipment's own was 2026-09-10T00:00:00Z.
        shipDate: '2026-09-10T07:00:00.000Z',
        parcelCount: 3,
        // Normalized into `ShipmentStatus` by the server, off the ladder in
        // `deriveShipmentStatus`, never bound raw.
        //
        // ⚠️ `in_transit`, agreeing with the `providerTrackingStatus` below it.
        // This example read `label_created` until 2026-09-11, when the ladder
        // began preferring the live label's `tracking_status` over the bare fact
        // that a label exists (status plan §3). The two keys agree by
        // construction: one live label per shipment is one transit value per
        // shipment, so nothing is duplicated and nothing is invented.
        //
        // 🛑 The agreement stops at the shipment. The same value is NOT fanned
        // out onto the boxes below as a per-box status; they carry the raw string
        // as `providerTrackingStatus` provenance and nothing more, because these
        // three FedEx ground parcels route independently and arrive on their own
        // days. "I got 5 of my 6 boxes" is the case that would be lied about.
        shipmentStatus: 'in_transit',
        // The master parcel below (sequence 1), copied up so the shipment has a name.
        masterTrackingNumber: 'FAKE0000000000000003',
        // INTEGER MINOR UNITS, multiplied and rounded by the server from the
        // provider's `{"currency":"usd","amount":16.54}`. 1654 is $16.54.
        costMinor: 1654,
        // 0 on every label on this account, and a real reading, not a null.
        insuranceCostMinor: 0,
        // 🛑 A bearer secret, so this one is fabricated like the tracking
        // numbers above. Real values are on `api.shipstation.com` and fetch
        // unauthenticated.
        labelUrl: 'https://api.shipstation.com/v2/downloads/14/EXAMPLE/label-198067499.pdf',
        // Null on all 50 probed labels; its wire shape has never been observed.
        insuranceClaim: null,
        // The provider's raw value, same run, kept for audit. Deliberately
        // disagrees with `shipmentStatus` above.
        providerTrackingStatus: 'in_transit',
        labelVoided: false,
        labelVoidedAt: null,
        packages: [
          {
            packageKey: 'se-197559213:158414018',
            labelId: 'se-197559213',
            trackingNumber: 'EXAMPLE-TRACKING-0003',
            sequence: 3,
            isMaster: false,
            weight: 1280,
            weightUnit: 'ounce',
            length: 26,
            width: 50,
            height: 4,
            dimUnit: 'inch',
            voided: false,
            voidedAt: null,
            // Copied down from the label by the server, see the binding above.
            providerTrackingStatus: 'in_transit',
          },
          {
            packageKey: 'se-197559213:158414019',
            labelId: 'se-197559213',
            trackingNumber: 'EXAMPLE-TRACKING-0002',
            sequence: 2,
            isMaster: false,
            weight: 464,
            weightUnit: 'ounce',
            length: 96,
            width: 4,
            height: 4,
            dimUnit: 'inch',
            voided: false,
            voidedAt: null,
            providerTrackingStatus: 'in_transit',
          },
          // ⚠️ The MASTER, sequence 1, returned LAST by the provider. This
          // ordering is the whole point of the example: index zero is not the
          // master, and nothing may assume it is.
          {
            packageKey: 'se-197559213:158414020',
            labelId: 'se-197559213',
            trackingNumber: 'EXAMPLE-TRACKING-0001',
            sequence: 1,
            isMaster: true,
            weight: 704,
            weightUnit: 'ounce',
            length: 71,
            width: 6,
            height: 13,
            dimUnit: 'inch',
            voided: false,
            voidedAt: null,
            providerTrackingStatus: 'in_transit',
          },
        ],
      },
    },

    // ── shipment ────────────────────────────────────────────────────────────
    // One record per ShipStation SHIPMENT, contributing into the SAME native
    // `shipment` rows the label stream resolves, through the same
    // `shipmentId` external id.
    //
    // This stream exists for exactly two values. `shipment_number` (the
    // merchant's order number, and the value a support agent is quoting) and
    // `store_id` live on the shipment resource and on NO label: the `shipment`
    // object a label carries is `writeOnly` in the V2 schema, so it never comes
    // back on a read. Build plan §9 measured the consequence — `shipment_number`
    // empty on 135 of 135 shipments — and listed this stream as owed.
    //
    // ── 🛑 What this stream must never grow into ────────────────────────────
    //   • NO `packages[]` fan-out. `GET /v2/shipments` returns package
    //     DEFINITIONS: distinct `shipment_package_id`s, the SAME `package_id`
    //     (`se-3`) on every row, and no tracking number at all. They are a
    //     packaging TYPE, not a box (probe §2, and `fields.ts` says so at
    //     length). Parcels come from labels, and only from labels.
    //   • NO carrier, service, ship date or status. The label stream owns all
    //     four. Two mappings of one connector writing one cell is the flip-flop
    //     the header warns about, and keeping the two field sets disjoint is
    //     what prevents it.
    //   • NO `external_order_id`. `fields.ts` is explicit that the app field
    //     holds the id "as it appears ON THE LABEL", and probe §2 found the
    //     SHIPMENT's own `external_order_id` null on the very sample where the
    //     label carried one. Binding it here would overwrite a real value with a
    //     null. This is a deliberate departure from the expansion plan §10,
    //     which lists `external_order_id` among what this stream populates.
    {
      key: 'shipment',
      // A GENUINE `modified_at` delta, unlike labels: `modified_at_start` /
      // `modified_at_end` are real filters, `modified_at` is a legal `sort_by`,
      // AND it is returned on the shipment object. One cursor, not two.
      syncMode: 'incremental',
      mappings: [
        {
          rootPath: '',
          target: { entityKind: 'shipment' },
          // Same answer and same reasoning as the label stream's root mapping:
          // the crawl is bounded by `importStart` and filtered locally to
          // shipments that have had a label, so "not returned" is never deletion
          // evidence. Declared for the same reason too — the platform ignores it
          // on an `incremental` stream, and it is the answer if that ever
          // changes.
          orphanBehavior: 'ignore',
          fields: [
            // Identity, and the whole point: `shipmentId` is `identity: true` in
            // fields.ts, so this binding auto-stamps
            // `identityRole: { kind: 'externalId' }` and the record lands on the
            // SAME native `shipment` row the label stream's root mapping
            // resolves from the same value. The two streams' `DataConnectorItem`
            // rows are distinct (the unique key is
            // `(connector, mapping, externalId)`) and both point at one instance,
            // which is the documented shape for two mappings contributing to one
            // record.
            { sourcePath: 'shipmentId', appField: 'shipmentId' },
            // 🛑 No `match` here either, and for a stronger reason than usual:
            // `shipment_number` is documented by ShipStation as "optional,
            // mutable, and does not require uniqueness, allowing multiple
            // shipments to share the same value". Match candidates are OR'd, so
            // a match on it would merge unrelated shipments that happen to share
            // a merchant order number.
            { sourcePath: 'shipmentNumber', target: 'shipment_number' },
            { sourcePath: 'storeId', appField: 'storeId' },
          ],
        },
      ],
      // The probe's own shipment (§2), the parent of the three-box label in the
      // label stream's example above. Its `external_order_id` was NULL on this
      // very record while the label carried `17954843328688`, which is the
      // evidence behind not binding it here.
      exampleRecord: {
        shipmentId: 'se-428778294',
        shipmentNumber: '14530',
        storeId: 'se-2943015',
      },
    },
  ],
  execute: shipstationSync,
})
