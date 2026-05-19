// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Shopify toolsets exposed to agents. The platform projects each `id` into
 * the runtime slug namespace as `app:shopify:<localId>` for agent-side
 * filtering. See plans/kopilot/apps/shopify-overhaul.md §5.
 *
 * Read/write split on orders so an admin enabling `orders.read` for a
 * triage agent does not accidentally arm it to refund. No `isDefault`
 * flag — admins pick every toolset deliberately, which doubles as the
 * write-approval gate.
 *
 * `list_shopify_stores` is intentionally toolset-less — it auto-attaches
 * whenever any other Shopify toolset is enabled (preflight, not a
 * feature). See plan §5 / §8 Q1.
 */
export const shopifyToolsets: Toolset[] = [
  {
    id: 'shopify.customers',
    name: 'Shopify customers',
    description: 'Find Shopify customers, get their profile, list their orders.',
    tools: ['find_shopify_customer', 'get_shopify_customer', 'list_customer_orders'],
  },
  {
    id: 'shopify.orders.read',
    name: 'Shopify orders (read)',
    description: 'Find and inspect Shopify orders, summarize recent activity.',
    tools: ['find_shopify_order', 'get_shopify_order', 'summarize_recent_orders'],
  },
  {
    id: 'shopify.orders.write',
    name: 'Shopify orders (write)',
    description:
      'Cancel and refund Shopify orders. Enable only for agents you trust to act unattended.',
    tools: ['cancel_shopify_order', 'refund_shopify_order'],
  },
  {
    id: 'shopify.products',
    name: 'Shopify products',
    description: 'Search products and inspect inventory across variants and locations.',
    tools: ['search_shopify_products', 'get_product_inventory'],
  },
]
