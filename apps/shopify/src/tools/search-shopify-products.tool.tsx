// src/tools/search-shopify-products.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import searchShopifyProductsExecute from './search-shopify-products.tool.server'

export const searchShopifyProductsTool = defineTool({
  id: 'search_shopify_products',
  name: 'Search Shopify products',
  description:
    'Search Shopify products by free-text query, status, vendor, or product type. Returns summaries — use get_product_inventory for variant-level inventory.',
  icon: shopifyIcon,
  inputs: z.object({
    query: z.string().optional().describe('Free-text search across title, tags, SKU, vendor.'),
    status: z.enum(['active', 'draft', 'archived']).optional(),
    vendor: z.string().optional(),
    productType: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional().describe('Default 10.'),
  }),
  outputs: z.object({
    products: z.array(
      z.object({
        shopifyProductId: z.string(),
        title: z.string(),
        handle: z.string(),
        status: z.string(),
        vendor: z.string().nullable(),
        productType: z.string().nullable(),
        tags: z.array(z.string()),
        totalInventory: z.number().int().nullable(),
        priceRange: z.object({
          min: z.object({ amount: z.string(), currencyCode: z.string() }),
          max: z.object({ amount: z.string(), currencyCode: z.string() }),
        }),
        variantsCount: z.number().int(),
        featuredImageUrl: z.string().nullable(),
      })
    ),
    truncated: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchShopifyProductsExecute,
})
