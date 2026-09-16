// src/tools/shared/connection.ts

/**
 * Resolve the Affirm credentials bound to the current invocation.
 *
 * Affirm is a **multi-field `secret` connection**, so everything lives on
 * `connection.fields` and `connection.value` is EMPTY. This is the FedEx
 * shape, not the ShipStation one (where the single `value` IS the key).
 *
 * Three connection variables are declared in the developer portal:
 * `merchant_id`, `public_key`, `private_key`.
 *
 * The platform also applies HTTP Basic (`public_key` : `private_key`) and
 * contributes the base URL. We still read all three here and send the header
 * ourselves — see `affirm-api.ts` — because a client that depends on an
 * invisible injection cannot be tested, and because `merchant_id` is a
 * REQUIRED query parameter that no platform layer supplies.
 */

import { getConnection } from '@auxx/sdk/server'

/** The three secrets an Affirm settlement or transaction read needs. */
export interface AffirmCredentials {
  /**
   * The merchant ARI, e.g. `07JVNWWI5PZM8L7Y`. Required as `merchant_id` on
   * every settlement and transaction call, and a stable upstream account
   * identity suitable for `connection-identify` / `externalAccountId`.
   */
  merchantId: string
  /** 16-character public key — the HTTP Basic username. */
  publicKey: string
  /** 32-character private key — the HTTP Basic password. Never logged. */
  privateKey: string
}

/**
 * Throw the platform's structured "not connected" error, which surfaces the
 * reconnect prompt in Settings → Apps → Affirm rather than a generic tool
 * failure.
 */
export function throwConnectionNotFound(): never {
  const err = new Error(
    'Affirm is not connected. Add your merchant ID and API key pair in Settings → Apps → Affirm.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/**
 * Read the three fields off an ALREADY-RESOLVED connection.
 *
 * A data connector never gets the ambient tool context — it is handed its
 * bound connection explicitly on `args.connection` — so the field reading is
 * separated from the ambient lookup below. Both callers then share one rule
 * about which fields are required, instead of drifting apart.
 *
 * All three are required: a call missing `merchant_id` is not a degraded call,
 * it is a 400 from Affirm, so it fails here as "not connected" instead.
 */
export function affirmCredentialsFrom(
  fields: Record<string, string> | undefined
): AffirmCredentials {
  if (!fields?.merchant_id || !fields?.public_key || !fields?.private_key) {
    throwConnectionNotFound()
  }
  return {
    merchantId: fields.merchant_id,
    publicKey: fields.public_key,
    privateKey: fields.private_key,
  }
}

/** Read the three fields off the connection bound to the current tool invocation. */
export function getAffirmCredentials(): AffirmCredentials {
  return affirmCredentialsFrom(getConnection()?.fields)
}
