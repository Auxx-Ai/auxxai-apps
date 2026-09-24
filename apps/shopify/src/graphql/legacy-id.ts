// src/graphql/legacy-id.ts

import { evidenceId } from '../blocks/shopify/shared/payments-evidence'

/** A GraphQL `legacyResourceId` as the numeric REST id; `evidenceId` alone admits unsafe digits. */
export function legacyId(value: unknown): number {
  const id = Number(evidenceId(value))
  if (!Number.isSafeInteger(id))
    throw new Error(`shopify: unsafe legacyResourceId ${String(value)}`)
  return id
}
