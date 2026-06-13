# FedEx

Agent-first FedEx shipment tracking for Auxx, built on the free **Basic Track
API** (pull, 100k calls/day). Five tracking tools and one polling trigger that
watches shipments for status changes and fans out to agents and workflows.

## What it does

| Surface | Id | Purpose |
| --- | --- | --- |
| Tool | `track_shipment` | Live status + scan history by tracking number (batched up to 30/call). |
| Tool | `track_by_reference` | Lookup by your own reference (order/PO/invoice) using the connected account. |
| Tool | `watch_shipment` | Validate + register a shipment so the trigger fires on future changes. |
| Tool | `unwatch_shipment` | Stop watching a shipment. |
| Tool | `list_watched_shipments` | List everything currently watched on this connection. |
| Trigger | `fedex.shipment-status-changed` | Polling trigger — fires when a watched shipment changes status. |

All five tools live in one toolset, **`fedex.tracking`**.

## Connection

FedEx has no hosted login — only the OAuth2 `client_credentials` grant — so this
is a **multi-field `secret`** connection. The app mints its own bearer tokens and
caches them in connection-scoped KV.

| Field | Key | Secret | Required |
| --- | --- | --- | --- |
| API Key | `client_id` | yes | yes |
| Secret Key | `client_secret` | yes | yes |
| Account Number | `account_number` | no | yes (required for reference lookups & production data) |

Multiple FedEx accounts in one org = multiple connections; KV scoping keeps each
account's token cache and watch registry separate.

## Settings

- **Use FedEx sandbox environment** (`useTestEnvironment`) — routes API + token
  calls to `apis-sandbox.fedex.com`. Requires sandbox credentials on the
  connection (FedEx issues separate sandbox key pairs).

## Architecture notes

- **Auth** (`tools/shared/fedex-auth.ts`): `client_credentials` mint + KV token
  cache (TTL = `expires_in − 300s`) + 401 invalidation. Module state does not
  survive between invocations, so the cache must be KV.
- **API client** (`tools/shared/fedex-api.ts`): SDK error-class mapping, 401
  retry-once, sandbox host switch. Per-number not-found is surfaced as
  `{ found: false }`, not an exception.
- **Mapper** (`tools/shared/map-shipment.ts`): single FedEx → normalized
  shipment mapper shared by tools and trigger. Unknown codes degrade to
  `unknown`; never throws.
- **Watch registry** (`tools/shared/watches.ts`): one connection-scoped KV row
  per tracking number (TTL 30 days, cap 100). No blob race between tool writes
  and trigger polls.
- **Trigger** (`triggers/shipment-status-changed/`): watch membership in shared
  KV; last-seen status for diffing in per-instance polling state, so multiple
  agents each observe every transition. Batched (≤30/call), per-chunk error
  tolerance — provider errors never kill the schedule.

## Development

```bash
pnpm install
pnpm test         # vitest — 56 tests across auth/api/mapper/watches/trigger
pnpm build        # auxx build (TS validation + bundle)
pnpm lint         # prettier --check
pnpm format       # prettier --write
```

## Status / TODO

Phase 1 (this build) ships the five tools + polling trigger. Outstanding items
before production (see `plans/apps/fedex/fedex-build-plan.md` §10):

- Replace `src/assets/icon.png` with the FedEx logo (currently the template
  placeholder).
- Configure the connection (multi-field secret variables) in the build portal.
- P3 portal onboarding (API Project + Track API enabled) and P4 sandbox
  verification (status-code taxonomy, test tracking numbers, reference-lookup
  disambiguation, rate tier).
- Capture real sandbox/prod responses into `docs/examples/`.

Out of scope for phase 1: workflow action block, quick actions, Advanced
Visibility webhooks (SVW v2.0, $199/mo), proof of delivery, Ship/Rate/Address.
