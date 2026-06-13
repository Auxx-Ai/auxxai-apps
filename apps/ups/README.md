# UPS

Agent-first UPS shipment tracking for Auxx, built on the free **Tracking v1
API**. Four tracking tools and one polling trigger that watches shipments for
status changes and fans out to agents and workflows.

## What it does

| Surface | Id | Purpose |
| --- | --- | --- |
| Tool | `track_shipment` | Live status, scans, ETA + optional POD/signature by tracking number (up to 30/call). |
| Tool | `watch_shipment` | Validate + register a shipment so the trigger fires on future changes. |
| Tool | `unwatch_shipment` | Stop watching a shipment. |
| Tool | `list_watched_shipments` | List everything currently watched on this connection. |
| Trigger | `ups.shipment-status-changed` | Polling trigger — fires when a watched shipment changes status. |

All four tools live in one toolset, **`ups.tracking`**.

## Connection

UPS uses the platform-managed **OAuth2 authorization-code** flow (`oauth2-code`,
Global / org-wide). The customer signs in on UPS's hosted login — we never see
their credentials. The access token (1h TTL, rotating refresh) lives on the
connection and the platform refreshes it lazily ahead of expiry, so tool code
never mints or refreshes tokens.

| Setting | Value |
| --- | --- |
| Authorize URL | `https://onlinetools.ups.com/security/v1/oauth/authorize` |
| Access Token URL | `https://onlinetools.ups.com/security/v1/oauth/token` |
| Token Request Auth | `basic-auth` |
| Refresh Schedule | `hourly` (belt; lazy refresh is the real mechanism) |
| Redirect URI | `{WEBAPP_URL}/api/apps/ups/oauth2/callback` |

The OAuth connection always points at **production**; the CIE test environment
(below) only changes where API calls go.

## Settings

- **Use UPS test environment (CIE)** (`useTestEnvironment`) — routes API calls to
  `wwwcie.ups.com`, which returns canned responses for UPS test tracking numbers
  only.

## Architecture notes

- **Connection** (`tools/shared/connection.ts`): reads the platform-managed OAuth
  bearer token from `connection.value`. A 401 is a hard `ConnectionExpiredError`
  (no app-side re-mint — the platform owns refresh).
- **API client** (`tools/shared/ups-api.ts`): UPS has no batch endpoint, so each
  number is a separate `GET /api/track/v1/details/{n}`, fanned out with bounded
  concurrency (≤30 numbers ≈ 6 waves). SDK error-class mapping, CIE host switch,
  `transId`/`transactionSrc` headers. Per-number not-found is surfaced as
  `{ found: false }`, not an exception. `trackNumbersSettled` adds per-number
  error tolerance for the trigger.
- **Mapper** (`tools/shared/map-shipment.ts`): single UPS → normalized shipment
  mapper shared by the track tool and the trigger. UPS `type` codes map to the
  cross-carrier status vocabulary (out-for-delivery folds into `in_transit`);
  unknown codes degrade to `unknown` and it never throws.
- **Watch registry** (`tools/shared/watches.ts`): one connection-scoped KV row
  per tracking number (TTL 14 days, cap 100). No blob race between tool writes
  and trigger polls.
- **Trigger** (`triggers/shipment-status-changed/`): watch membership in shared
  KV; last-seen status for diffing in per-instance polling state, so multiple
  agents each observe every transition. Per-number error tolerance — provider
  errors never kill the schedule.

## Development

```bash
pnpm install
pnpm test         # vitest — 46 tests across api/mapper/watches/trigger
pnpm build        # auxx build (TS validation + bundle)
pnpm lint         # prettier --check
pnpm format       # prettier --write
```

## Status / TODO

Phase 1 (this build) ships the four tools + polling trigger. Outstanding items
before production (see `plans/apps/ups/ups-build-plan.md` §10):

- Replace `src/assets/icon.png` with the UPS shield (currently the template
  placeholder).
- Configure the `oauth2-code` connection in the build portal and register the
  redirect URI as the app's Callback URL in the UPS portal (P3 onboarding).
- P4 CIE verification: refresh-grant behavior (does `/oauth/token` accept
  `grant_type=refresh_token`, or is `/oauth/refresh` required?), full status-code
  taxonomy from `Tracking.yaml`, current test tracking numbers, refresh-token
  rotation.
- Capture real CIE/prod track responses into `docs/examples/`.

Out of scope for phase 1: workflow action block, quick actions, Track Alert push
webhooks (premium/US-only), Time In Transit, Address Validation, Locator,
Delivery Intercept.
