// src/tools/shared/connection.ts

/**
 * Resolve the bound Stripe connection for a tool call. Tools use the unified
 * `getConnection()` SDK helper — the platform bridge picks the credId from
 * `Agent.appAccounts['stripe'].credId`. Stripe is org-scope (see
 * plans/kopilot/apps/stripe-overhaul.md §3 decision #1) so the resolved
 * credential is whichever connection the admin bound on the agent.
 */
import { getConnection } from '@auxx/sdk/server'
import { throwConnectionNotFound } from '../../blocks/stripe/shared/stripe-api'

export function getStripeApiKey(): string {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}
