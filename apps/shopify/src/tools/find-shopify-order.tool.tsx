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
  exampleOutput: {
    found: true,
    order: {
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
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: findShopifyOrderExecute,
  agent: { toolsetSlug: 'shopify.orders.read' },
})
