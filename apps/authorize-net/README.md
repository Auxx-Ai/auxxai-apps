# Authorize.net

> Settled batches, the transactions inside them, and what has not settled yet.

Authorize.net is a **gateway in front of an acquirer**. The acquirer batches the
day's captures, settles each batch to the merchant's bank account **gross**, and
bills the card fees on a **monthly statement**. A batch is therefore a real bank
deposit with a real reference, and the settlement side of an Authorize.net sale
has no other reader.

## What it does

| Surface        | What                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Data connector | Settled batches as payout headers, their transactions fanned out as members                                                            |
| Read tools     | `list_authorize_net_batches`, `list_authorize_net_batch_transactions`, `get_authorize_net_transaction`, `list_authorize_net_unsettled` |
| Write tools    | None. Authorize.net has a write API and a sandbox, but Shopify can refund the same charge and would not be told — build plan §7        |
| Workflow block | Four read operations over the same tools                                                                                               |

It declares **no entities and no app fields**. Settlement facts contribute into
the native `payout` and `processor_balance_entry` kinds through
`@auxx/sdk/financial-source`, which is the contract the Shopify app uses too.

## Connecting

Three connection variables, configured on the ConnectionDefinition in the build
portal (not in code):

| Variable          | Kind   | Value                                                                                                       |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `api_login_id`    | plain  | API Login ID, from the Merchant Interface → Account → Settings → Security Settings → API Credentials & Keys |
| `transaction_key` | secret | Transaction Key, from the same screen. Shown once                                                           |
| `environment`     | plain  | `live` or `test`. Picks the host; it is never a user-entered URL                                            |

`test` points at the Authorize.net sandbox, which is free to create and is the
right place to run a connection for the first time.

**The Transaction Details API may need to be enabled** in the Merchant Interface
(same Security Settings screen) before the reporting calls return data. Unverified,
but it fails as an authenticated call returning an error code rather than an auth
failure — check it first when a working connection reads no batches.

## Two things to know before changing the money code

**There is no fee on the wire.** The acquirer bills card fees on a monthly
statement, so no response carries one and no tool output has a fee column. Do not
derive a fee from a rate — the amount is unknowable until the statement arrives,
which is what the platform's `rail-fee-status` waits for.

**A batch total is a sum, not a stated figure.** `getSettledBatchList` reports
statistics **per card brand** (Visa, Mastercard, AmericanExpress, Discover,
eCheck) and no single total. `netAmount` is the sum over brands of
`chargeAmount − refundAmount − returnedItemAmount − chargebackAmount`, computed
once in `batchNetAmount` and nowhere else.

## Example data

The live probe (build plan §9 phase 0) has not run. Every example output and test
fixture comes from Authorize.net's own API reference examples; nothing here has
been observed against a merchant account. `ASSUMPTIONS.md` lists what the probe
must confirm.

## Layout

```
src/authorize-net.connector{,.server}.ts   Batches by month window, members by batchId
src/settlement-evidence.ts                 Authorize.net JSON in, money contract out
src/tools/shared/                          HTTP client, connection, projections, schemas
src/tools/*.tool.{tsx,server.ts}           Four reads, no writes
src/blocks/authorize-net/                  Workflow block over the read tools
```

### Names

Three different strings, all intentional: the connector id is `authorizenet` (the
SDK's id pattern forbids underscores), the `providerKey` on every `sourceKey` is
`authorize_net` (it matches the platform rail catalogue's settlement source), and
the read toolset is `authorize_net.settlements`.
