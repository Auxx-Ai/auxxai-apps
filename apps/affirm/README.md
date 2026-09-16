# Affirm

> Affirm deposits, settlement events and charges.

Affirm pays the merchant **directly**, on its own weekly schedule, separate from
Shopify Payments — even when the customer chose Affirm at a Shopify checkout.
Each deposit carries the reference that appears on the bank statement, which
makes it a genuine second rail with its own clearing account rather than
something already inside another processor's payout.

## What it does

| Surface | What |
| --- | --- |
| Data connector | Two streams: `payout` (deposits, with their settlement events fanned out as children) and `balance_transaction` (standalone events, including ones not yet assigned to a deposit) |
| Read tools | `list_affirm_settlements`, `list_affirm_settlement_events`, `list_affirm_charges`, `get_affirm_charge` |
| Write tools | `capture_affirm_charge`, `refund_affirm_charge`, `void_affirm_charge` — separate `affirm.write` toolset, `internal` surface only |
| Workflow block | Four read operations over the same tools |

It declares **no entities and no app fields**. Settlement facts contribute into
the native `payout` and `processor_balance_entry` kinds through
`@auxx/sdk/financial-source`, which is the contract the Shopify app uses too.

## Connecting

Three values, all from the Affirm merchant portal:

- **Merchant ID** — the account identifier in the portal's address bar, also
  `merchant_ari` on settlement reports. Contrary to some third-party guides, you
  do not need to request it from Affirm support.
- **Public API Key** and **Private API Key** — the *API Keys* tab. Stored
  encrypted; sent as HTTP Basic.

⚠️ **Affirm issues production keys only.** There is no sandbox pair, so the
connection reads live data from the first sync, and the write tools act on real
consumer loans.

## Two things to know before changing the money code

**`fees` is the whole fee.** `transaction_fees` is a component *of* it, not an
addition to it — `total_settled == sales + fees` exactly, verified across six
live deposits. Affirm's CSV export splits the same money into two columns that
sum to the API's single `fees`, which is what an earlier pass got wrong. Adding
them double-counts, overstates fee expense and gross, **and still balances** — so
nothing downstream catches it. `settlement-evidence.ts` has the full argument.

**The docs and the exports disagree on spellings.** The public API emits
`loan_capture`; the CSV export says `loan_captured`. Both are accepted, and the
unknown-event fallback is deliberate rather than defensive.

## Refunds have a competing writer

These tools refund **directly through Affirm**. Shopify's own refund path can
refund the same charge, and neither knows about the other — a refund issued here
does not tell Shopify, so the order will still show as unrefunded. Decide which
system owns refunds before granting the `affirm.write` toolset.

## Layout

```
src/settlement-evidence.ts     Affirm JSON in, platform money contract out.
                               The ONLY file that knows Affirm's shape.
src/affirm.connector{,.server}.ts   Two streams, cursor discipline, paging
src/tools/shared/              HTTP client, connection, projections, schemas
src/tools/*.tool.{tsx,server.ts}    Four reads, three writes
src/blocks/affirm/             Workflow block over the read tools
```
