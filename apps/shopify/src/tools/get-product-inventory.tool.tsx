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
  exampleOutput: {
    shopifyProductId: 'gid://shopify/Product/7203948571',
    title: 'Classic Tee',
    totalInventory: 142,
    variants: [
      {
        shopifyVariantId: 'gid://shopify/ProductVariant/41827364920',
        title: 'Black / M',
        sku: 'TEE-CLS-BLK-M',
        available: 58,
        locations: [
          {
            locationId: 'gid://shopify/Location/72648392',
            name: 'Main Warehouse',
            available: 50,
          },
          {
            locationId: 'gid://shopify/Location/72648456',
            name: 'Retail Store',
            available: 8,
          },
        ],
      },
      {
        shopifyVariantId: 'gid://shopify/ProductVariant/41827364921',
        title: 'Black / L',
        sku: 'TEE-CLS-BLK-L',
        available: 84,
        locations: [
          {
            locationId: 'gid://shopify/Location/72648392',
            name: 'Main Warehouse',
            available: 84,
          },
        ],
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: getProductInventoryExecute,
  agent: { toolsetSlug: 'shopify.products' },
})
