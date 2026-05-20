// src/tools/find-shopify-order.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import findShopifyOrderExecute from './find-shopify-order.tool.server'

const OrderDetail = z.object({
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
})

export const findShopifyOrderTool = defineTool({
  id: 'find_shopify_order',
  name: 'Find Shopify order',
  description:
    'Look up a Shopify order by name (#1042), order GID, or customer email. Returns full order detail when matched, or { found: false } if no order matches.',
  icon: shopifyIcon,
  inputs: z.object({
    query: z
      .string()
      .describe('Order name (e.g. #1042), order GID, or email. Tool picks the right lookup.'),
  }),
  outputs: z.object({
    found: z.boolean(),
    order: OrderDetail.nullable(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: findShopifyOrderExecute,
  agent: { toolsetSlug: 'shopify.orders.read' },
})
