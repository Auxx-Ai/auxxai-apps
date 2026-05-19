// src/tools/get-shopify-order.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import getShopifyOrderExecute from './get-shopify-order.tool.server'

export const getShopifyOrderTool = defineTool({
  id: 'get_shopify_order',
  name: 'Get Shopify order',
  description:
    'Full Shopify order detail including line items, shipping address, totals, and tracking. Use after find_shopify_order or list_customer_orders when you have an order GID.',
  icon: shopifyIcon,
  inputs: z.object({
    shopifyOrderId: z.string().describe('Order GID.'),
  }),
  outputs: z.object({
    shopifyOrderId: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    customer: z
      .object({
        auxxRecordId: refs.entity('contact').nullable(),
        shopifyId: z.string(),
        email: z.string().nullable(),
        fullName: z.string().nullable(),
      })
      .nullable(),
    totalPrice: z.object({ amount: z.string(), currencyCode: z.string() }),
    subtotalPrice: z.object({ amount: z.string(), currencyCode: z.string() }),
    totalTax: z.object({ amount: z.string(), currencyCode: z.string() }),
    totalShipping: z.object({ amount: z.string(), currencyCode: z.string() }),
    financialStatus: z.string().nullable(),
    fulfillmentStatus: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    cancelReason: z.string().nullable(),
    lineItems: z.array(
      z.object({
        title: z.string(),
        quantity: z.number().int(),
        sku: z.string().nullable(),
        price: z.object({ amount: z.string(), currencyCode: z.string() }),
        variantTitle: z.string().nullable(),
      })
    ),
    shippingAddress: z
      .object({
        address1: z.string().nullable(),
        city: z.string().nullable(),
        country: z.string().nullable(),
        zip: z.string().nullable(),
      })
      .nullable(),
    trackingInfo: z
      .array(
        z.object({
          company: z.string().nullable(),
          number: z.string().nullable(),
          url: z.string().nullable(),
        })
      )
      .describe('Flattened from fulfillments[].trackingInfo[]. May be empty.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: getShopifyOrderExecute,
})
