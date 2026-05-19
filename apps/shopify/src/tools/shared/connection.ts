// src/tools/shared/connection.ts

/**
 * Resolve the bound Shopify connection for a tool call. Tools use the
 * unified `getConnection()` SDK helper — the platform bridge picks the
 * credId from `Agent.appAccounts['shopify'].credId` (see
 * plans/kopilot/apps/agent-credentials.md §6.2). Multi-store orgs select
 * which store the agent acts on via the account picker, no tool-side
 * knowledge required.
 */
import { getConnection } from '@auxx/sdk/server'
import { getShopDomain, throwConnectionNotFound } from '../../blocks/shopify/shared/shopify-api'

export interface ShopifyConnectionInfo {
  token: string
  shopDomain: string
}

export function getShopifyConnection(): ShopifyConnectionInfo {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) {
    const err = new Error(
      'Shopify connection is missing the shop subdomain. Reconnect the store under Settings → Apps → Shopify.'
    ) as Error & { code: string }
    err.code = 'CONNECTION_INVALID'
    throw err
  }
  return { token: connection.value, shopDomain }
}
