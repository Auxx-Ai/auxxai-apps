// src/app.tsx

/**
 * Affirm app: a settlement source, and the charges behind it.
 *
 * Auxx-Lift sells through Shopify, but Affirm's money does NOT arrive inside a
 * Shopify Payments deposit — it lands directly from Affirm on Affirm's own
 * weekly `deposit_id`. That was verified, not assumed: of this org's real paid
 * orders, 31 ran on Affirm and exactly 0 of them appear in any Shopify
 * Payments balance entry. Affirm is a genuine second rail, and for this
 * business it is the FIRST real-money settlement source of any kind.
 *
 * Two surfaces:
 *
 * - **Data connector** — two streams, `payout` and `balance_transaction`,
 *   contributing into the platform's native `payout` and
 *   `processor_balance_entry` kinds. See ./affirm.connector.ts.
 * - **Read tools** — settlements, settlement events, and charges, in one
 *   STAFF toolset. See ./tools/toolsets.ts.
 * - **Write tools** — capture, refund and void, in a SECOND, separate toolset
 *   that is narrowed to the `internal` surface alone. ⚠️ They move real money
 *   on a real customer's consumer loan, against a live lender with no sandbox,
 *   and they do NOT tell Shopify. See ./tools/shared/writes.ts for the fence.
 *
 * This app declares **NO `entities` and NO `fields`** of its own. That is the
 * point, not an omission: Affirm is a financial source, the platform already
 * has a finished contract for what a financial source hands it, and every
 * value this app emits is a native attribute the SDK's shared financial-source
 * mappings name (`@auxx/sdk/financial-source`). Inventing an Affirm-shaped
 * record model would produce rows nothing reconciles against.
 *
 * It also registers **no `PayoutSource`**. The registry path and the connector
 * path are mutually exclusive by construction — the platform refuses the
 * legacy writer once a connector holds an enabled `upsert` mapping into
 * `payout` / `processor_balance_entry`, which is exactly what this connector
 * declares. The consequence, stated plainly: an Affirm deposit is ingested,
 * reconciled and visible, but is NOT posted to the ledger. Settlement posting
 * is a separate, currently disabled operation.
 *
 * ⚠️ The connector and every settlement/charge read are READ-ONLY. The three
 * write tools are not, and the risks that used to keep them out are not
 * resolved — they are DECLARED. This account has production API keys and no
 * sandbox, so every write lands on a real customer's loan; and Shopify's own
 * refund path can refund the same Affirm charge, so a refund issued here plus
 * a refund issued in Shopify Admin is two refunds. Nothing in this app calls
 * Shopify or tries to detect the second writer. Who owns a refund is an
 * operator decision, and the write toolset's description says so to the admin
 * granting it.
 */

import { TextBlock } from '@auxx/sdk/client'
import { affirmConnector } from './affirm.connector'
import { affirmBlock } from './blocks/affirm/affirm.workflow'
import { captureAffirmChargeTool } from './tools/capture_affirm_charge.tool'
import { getAffirmChargeTool } from './tools/get_affirm_charge.tool'
import { listAffirmChargesTool } from './tools/list_affirm_charges.tool'
import { listAffirmSettlementEventsTool } from './tools/list_affirm_settlement_events.tool'
import { listAffirmSettlementsTool } from './tools/list_affirm_settlements.tool'
import { refundAffirmChargeTool } from './tools/refund_affirm_charge.tool'
import { affirmToolsets } from './tools/toolsets'
import { voidAffirmChargeTool } from './tools/void_affirm_charge.tool'

export const app = {
  dataConnectors: [affirmConnector],
  // Read-only operations over the four read tools. The writes below are
  // deliberately NOT block operations: a block operation is reachable by
  // Kopilot without the panel ever rendering, so putting a refund here would
  // route around the `affirm.write` toolset fence (build plan §7).
  workflow: { blocks: [affirmBlock] },
  tools: [
    listAffirmSettlementsTool,
    listAffirmSettlementEventsTool,
    listAffirmChargesTool,
    getAffirmChargeTool,
    // ⚠️ Writes. A separate toolset (`affirm.write`), `internal` surface only.
    captureAffirmChargeTool,
    refundAffirmChargeTool,
    voidAffirmChargeTool,
  ],
  toolsets: affirmToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Affirm</TextBlock>
      <TextBlock align="left">
        Affirm pays you directly, on its own weekly schedule, and each deposit carries the same id
        your bank statement shows. This app syncs those deposits and the individual captures,
        refunds and fees behind them, so a line on the bank statement can be matched to the orders
        that produced it.
      </TextBlock>
      <TextBlock align="left">
        Staff and internal agents can also look up what a customer financed: a charge, its
        authorisation and capture history, and the Shopify payment session it belongs to. That is
        how an Affirm settlement gets tied back to a Shopify order.
      </TextBlock>
      <TextBlock align="left">
        Staff can also capture, refund and void an Affirm charge. These move real money on a
        customer&apos;s loan, they cannot be undone, and they are granted separately from the
        lookups — give them to internal staff agents only, never to a customer-facing chat or email
        agent.
      </TextBlock>
      <TextBlock align="left">
        A refund issued here reaches Affirm only. Shopify is not told, so the order will still show
        as unrefunded there and you will need to reconcile it yourself. Shopify can also refund the
        same Affirm charge on its own, so decide which system issues a refund before you use both.
      </TextBlock>
      <TextBlock align="left">
        Connect with your Merchant ID and the public and private API keys from the API Keys tab of
        the Affirm merchant portal. Deposits are imported from the start date set on the connector,
        or from the beginning if you leave it blank.
      </TextBlock>
    </>
  )
}
