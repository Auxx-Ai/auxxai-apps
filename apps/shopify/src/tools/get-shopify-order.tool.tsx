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
  exampleOutput: {
    shopifyOrderId: 'gid://shopify/Order/5512033210',
    name: '#1042',
    createdAt: '2026-06-01T16:30:00Z',
    updatedAt: '2026-06-03T09:12:00Z',
    customer: {
      // refs.entity('contact') marker — null or a sample RecordId both validate.
      auxxRecordId: null,
      shopifyId: 'gid://shopify/Customer/6820315234',
      email: 'jane@example.com',
      fullName: 'Jane Cooper',
    },
    totalPrice: { amount: '74.00', currencyCode: 'USD' },
    subtotalPrice: { amount: '64.00', currencyCode: 'USD' },
    totalTax: { amount: '5.00', currencyCode: 'USD' },
    totalShipping: { amount: '5.00', currencyCode: 'USD' },
    financialStatus: 'PAID',
    fulfillmentStatus: 'FULFILLED',
    cancelledAt: null,
    cancelReason: null,
    lineItems: [
      {
        title: 'Classic Tee',
        quantity: 2,
        sku: 'TEE-CLS-BLK-M',
        price: { amount: '24.00', currencyCode: 'USD' },
        variantTitle: 'Black / M',
      },
      {
        title: 'Canvas Tote',
        quantity: 1,
        sku: 'TOTE-NAT',
        price: { amount: '16.00', currencyCode: 'USD' },
        variantTitle: null,
      },
    ],
    shippingAddress: {
      address1: '548 Market St',
      city: 'San Francisco',
      country: 'United States',
      zip: '94104',
    },
    trackingInfo: [
      {
        company: 'USPS',
        number: '9400111899223817329012',
        url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223817329012',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: getShopifyOrderExecute,
  agent: { toolsetSlug: 'shopify.orders.read' },
})
