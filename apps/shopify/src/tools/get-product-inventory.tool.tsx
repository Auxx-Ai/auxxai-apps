// src/tools/get-product-inventory.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import getProductInventoryExecute from './get-product-inventory.tool.server'

export const getProductInventoryTool = defineTool({
  id: 'get_product_inventory',
  name: 'Get Shopify product inventory',
  description:
    'Get variant-level inventory across all locations for a Shopify product. Use after search_shopify_products when the user asks about stock levels.',
  icon: shopifyIcon,
  inputs: z.object({
    shopifyProductId: z.string(),
  }),
  outputs: z.object({
    shopifyProductId: z.string(),
    title: z.string(),
    totalInventory: z.number().int().nullable(),
    variants: z.array(
      z.object({
        shopifyVariantId: z.string(),
        title: z.string(),
        sku: z.string().nullable(),
        available: z.number().int().nullable(),
        locations: z.array(
          z.object({
            locationId: z.string(),
            name: z.string(),
            available: z.number().int().nullable(),
          })
        ),
      })
    ),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: getProductInventoryExecute,
})
