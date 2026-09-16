// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Two toolsets, and they are BOTH staff grants — but they are not the same
 * decision, which is the whole reason there are two.
 *
 * Toolsets are the approval gate an admin uses to hand an agent a group of
 * tools at once. Every tool with an `agent` surface key must name a
 * `toolsetSlug` matching one of these ids, or it is filed under
 * `app:unknown:default` and never appears in the agent picker.
 *
 * ⚠️ Nothing here is marked `externalSafe`, and every tool in it narrows its
 * `surfaces` to `internal` and `builder`. Knowing an order number must not be
 * enough to enumerate what another customer financed, and an Affirm charge is
 * a consumer LOAN — its existence, amount and refund state are not facts to
 * hand to an anonymous chat visitor. `surfaces` is not a security gate (the
 * admin granting the toolset is), so this is a default, and the description
 * below says plainly what the admin is agreeing to.
 *
 * ## `affirm.write` is a separate grant, and goes narrower still
 *
 * Capture, refund and void (build plan §7) are NOT added to the read toolset.
 * Granting an agent the ability to LOOK UP what a customer financed and
 * granting it the ability to MOVE MONEY ON THAT CUSTOMER'S LOAN are two
 * different admin decisions, and an admin who wants the first must not get the
 * second by accident.
 *
 * The read tools narrow to `['internal', 'builder']`. The write tools go one
 * step further and narrow to `['internal']` ALONE:
 *
 * - No `chat`, no `email`. ShipStation §7's rule, and it matters far more here:
 *   knowing an order number must not authorise refunding a loan, and an email
 *   arriving from an address is not proof of who sent it.
 * - No `builder` either — unlike the reads. ⚠️ This account has production keys
 *   and NO SANDBOX, so there is no such thing as trying a refund out to see
 *   what it does. Every call in the builder would be a live refund of a real
 *   customer's loan, so the builder surface is not offered.
 * - Nothing is `externalSafe`, in either toolset.
 *
 * `surfaces` is not a security gate (the admin granting the toolset is), so all
 * of the above is a default. The description below is what the admin actually
 * reads, which is why it says in as many words what they are agreeing to.
 */
export const affirmToolsets: Toolset[] = [
  {
    id: 'affirm.settlements',
    name: 'Affirm settlements and charges',
    description:
      'Read Affirm deposits, the settlement events behind them, and the charges customers ' +
      'financed. STAFF ONLY: grant this to an internal agent, never to a customer-facing chat ' +
      'or email agent — it can enumerate any customer’s Affirm loan.',
    tools: [
      'list_affirm_settlements',
      'list_affirm_settlement_events',
      'list_affirm_charges',
      'get_affirm_charge',
    ],
  },
  {
    id: 'affirm.write',
    name: 'Affirm charge writes (moves real money)',
    description:
      '⚠️ THESE TOOLS MOVE REAL MONEY ON A CUSTOMER’S CONSUMER LOAN. Capture settles a loan, ' +
      'refund returns money on one, and void cancels one outright. Every call reaches a live ' +
      'lender — there is no sandbox and nothing here can be undone from Auxx. ' +
      'DO NOT GIVE THIS TOOLSET TO A CUSTOMER-FACING AGENT. Not to a chat agent, not to an ' +
      'email agent, not to anything an outside party can talk to: knowing an order number is ' +
      'not authorisation to refund somebody’s loan. Staff and internal agents only, and only ' +
      'where a human has already decided the money should move. ' +
      'These tools also do NOT tell Shopify. Shopify can refund the same Affirm charge itself, ' +
      'so a refund issued here plus a refund issued in Shopify Admin is two refunds.',
    tools: ['capture_affirm_charge', 'refund_affirm_charge', 'void_affirm_charge'],
  },
]
